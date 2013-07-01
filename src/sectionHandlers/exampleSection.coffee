utils = require("../utils")
_ = require('underscore')
str = require("underscore.string")
async = require("async")

# Entire section
beginSectionTemplate = """
  <div class='section-example'>
"""

endSectionTemplate = """
  </div>
"""

# Code, Markup, Style
beginAssetSubTemplate = """<div id="{{{id}}}-{{{name}}}tab" class="tab_content">"""
endAssetSubTemplate = """</div>"""

# Process an example section
class ExampleSection
  constructor: (@id, token) ->
    @tokens = []
    @tokens.push utils.rawToken(_.template(beginSectionTemplate, id: @id))
    @currentAsset = null
    @navLinks = null

    # Tokens to insert before the assets
    @preTokens = []
    @assets = {}


  @begin: (id, token) ->
    section = new ExampleSection(id, token)

  # Begin asset
  #
  # Assets (markup, code, style) are put in their own div so they can
  # be styled in their own containers.
  beginAsset: (name) ->
    @closeAsset()
    @currentAsset = name
    utils.rawToken _.template(beginAssetSubTemplate, id: @id, name: name)


  # Closes an asset.
  closeAsset: ->
    if @currentAsset and !@isMeta()
      @tokens.push utils.rawToken("</div>")
      @currentAsset = null

  # End example section.
  end: (token, cb) ->
    @closeAsset()
    that = @
    token = utils.rawToken("</div>")
    that.tokens.push token
    that.tokens = that.preTokens.concat(that.tokens)
    cb()

  isMeta: ->
    @currentAsset == ":::meta"

  # Set an asset, overriding it if it exists
  setAsset: (name, text) ->
    @assets[name] = text

  # Append value to an existing asset, creating it if it does not exist
  appendAsset: (name, text, separator) ->
    if @assets[name]
      @assets[name] += "\n\n" + text
    else
      @assets[name] = text

  # Push a token into example section
  #
  # This section converts headings into divs as well as captures
  # any code, markup and style.
  #
  # Code block options
  #
  #   --no-capture  Do not capture code
  #   --hide        Do not render block in output HTML
  #
  push: (token) ->
    {type, text, lang, depth} = token
    lang ?= ""
    lang = lang.trim()
    hide = false

    # The first heading becomes the anchor for this section
    if type == "heading" and !@navLinks
      @navLinks = []
      @navLinks.push
        id: @id
        type: "example"
        title: text

    # on special sections, convert to divs
    if type == "heading" and text == ":::meta"
      div = @beginAsset(text.toLowerCase())
      unless @isMeta()
        @tokens.push div

    else if @isMeta()
      if type == "code"
        switch lang
          when "layout"
            @layoutTemplate = text
          when "scripts"
            @preScripts += text

    # collect assets specified by > and >> operators
    else if type == "code"
      parts = utils.parseLineArgs(lang)
      language = parts[0]
      args = parts.slice(1) || []
      noCapture = args.indexOf('--no-capture') > -1
      hide = args.indexOf('--hide') > -1

      unless noCapture
        # new asset
        idx = args.indexOf(">")
        if idx > -1 and (name = args[idx+1])
          @setAsset name, text

        else
          ## append asset
          idx = args.indexOf(">>")
          if idx > -1 and (name = args[idx+1])
            @appendAsset name, text

          else if language == "js" or language == "javascript"
            @appendAsset "script.js", text

          else if language == "html"
            @appendAsset "markup.html", text

          else if language == "css"
            @appendAsset "style.css", text

    # Do not add the token back for rendering if marked as `--hide`
    unless hide or @isMeta()
      @tokens.push token


module.exports = ExampleSection

