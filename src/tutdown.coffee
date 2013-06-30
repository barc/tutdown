marked = require("marked")
hjs = require("highlight.js")
codeFilter = require("./codeFilter")
async = require("async")
_ = require("underscore")
utils = require("./utils")
fs = require("fs")
handlebars = require("handlebars")
npath = require("path")
render = require("./render")

_.templateSettings =
  interpolate: /{{{(.+?)}}}/g
  escape: /{{([^{]+?)}}/g

sectionHandlers =
  Example: require("./sectionHandlers/exampleSection")


# Markdown for tutorials
class Tutdown
  constructor: (@options={}) ->
    if !@options.assetPrefix
      throw new Error('options.assetPrefix is REQUIRED')
    @examples = {}
    @docScript = ""

    # Link objects returned from section handlers
    #
    # Link object = {
    #   type: "type of link"
    #   title: "title of link"
    #   anchor: "anchor id, eg #ex0"
    # }
    @navLinks = []


  # Process specially marked sections in Markdown
  #
  # Sections have this syntax
  #
  #   :::BEGIN section_identifier
  #
  #   :::END
  #
  processSections: (tokens, cb) ->
    # markers must start with at least three colons, :::
    beginSection = /^:{3,}BEGIN\s+(\w.+)\s*$/
    endSection = /^:{3,}END\s*$/
    tokenStack = []
    section = null
    sections = {}
    exampleCounter = 0

    processToken = (token, cb) =>
      {type, text, lang} = token

      if type == "paragraph" && matches = text.match(beginSection)
        klass = matches[1]
        id = @options.assetPrefix + exampleCounter
        exampleCounter += 1
        section = sectionHandlers[klass].begin(id, token)
        cb()
      else if type == "paragraph" && matches = text.match(endSection)
        section.end token, (err) =>
          return cb(err) if err
          sections[section.id] = section

          # insert a placeholder for this section
          tokenStack.push
            text: "{{{sections.#{section.id}.html}}}"
            type: "text"
            escaped: true
          section = null
          cb()
      else if section
        section.push token
        cb()
      else
        tokenStack.push token
        cb()

    async.forEachSeries tokens, processToken, (err) ->
      return cb(err) if err

      tokenStack.links = tokens.links
      tokenStack
      cb null, tokenStack, sections


  # Process source returning only tokens
  #
  # Each section
  #   id
  #   tokens
  #   assets
  #
  # returns (err, docTokens, sections)
  process: (source, options, cb) ->
    if typeof options is "function"
      cb = options
      options = {}

    defaults =
      gfm: true
      tables: true
      breaks: false
      pedantic: false
      sanitize: true
      smartLists: true
      langPrefix: "language-"

    options = _.defaults(options, defaults)
    self = @
    tokens = marked.Lexer.lex(source, options)
    @processSections tokens, cb


module.exports = Tutdown
