marked = require("marked")
hjs = require("highlight.js")
async = require("async")
_ = require("underscore")
utils = require("./utils")
fs = require("fs")
handlebars = require("handlebars")
npath = require("path")
render = require("./render")
str = require("underscore.string")

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
  # If a section is not handled, it is converted into  a div.
  # For example, :::BEGIN foo bar :::END becomes <div class='foo bar'></div>
  processSections: (tokens, cb) ->
    # markers must start with at least three colons, :::
    beginSection = /^:{3,}BEGIN\s+(\w.+)\s*$/
    endSection = /^:{3,}END/
    tokenStack = []
    section = null
    sections = {}
    exampleCounter = 0
    closeDiv = false

    processToken = (token, cb) =>
      {type, text, lang} = token

      if type == "heading"
        token._attributes = "id='h-#{str.slugify(token.text)}'"

      if type == "paragraph" && matches = text.match(beginSection)
        klass = matches[1]
        id = @options.assetPrefix + exampleCounter
        exampleCounter += 1
        # if there is a section handler process it, else treat it as a div
        # class
        if sectionHandlers[klass]
          section = sectionHandlers[klass].begin(id, token)
        else
          token = utils.rawToken("<div class='#{klass}'>")
          if section
            section.push token
          else
            tokenStack.push token
          closeDiv = true
        cb()

      else if type == "paragraph" && matches = text.match(endSection)
        if closeDiv
          token = utils.rawToken('</div>')
          if section
            section.push token
          else
            tokenStack.push token
          closeDiv = false
          cb()
        else
          section.end token, (err) =>
            return cb(err) if err
            sections[section.id] = section

            # insert a placeholder for this section
            tokenStack.push
              #text: "{{{sections[\"#{section.id}\"].html}}}"
              text: "{{{sections['#{section.id}'].html}}}"
              type: "html"
              pre: true

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
      sanitize: false
      smartLists: true
      langPrefix: ""

    options = _.defaults(options, defaults)
    self = @
    tokens = marked.Lexer.lex(source, options)
    @processSections tokens, cb


module.exports = Tutdown
