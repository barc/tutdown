utils = require("../utils")
_ = require('underscore')
str = require("underscore.string")
async = require("async")
Path = require("path")

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

    # Code block options preceed the code block and have this signature `:::@`
    if type == "paragraph" and text.indexOf(':::@') is 0
      # do not save token, but save the lang for next code block
      @nextArgs = text.slice(4).trim().split(/\s+/)
      return

    # Collect assets
    if type == "code"
      parts = lang.split(/\s+/)
      language = parts[0]
      extname = Path.extname(language)
      if extname.length > 0
        token.lang = language = extname.slice(1)

      args = @nextArgs || parts.slice(1) || []
      noCapture = args.indexOf('--no-capture') > -1
      hide = args.indexOf('--hide') > -1
      @nextArgs = null

      if !noCapture
        switch language
          when "js", "javascript"
            filename = "script.js"
          when "css"
            filename = "style.css"
          when "html"
            filename = "markup.html"
        if filename
          @appendAsset filename, text

    # some code blocks are capture but not shown
    if !hide
      @tokens.push token


module.exports = ExampleSection

