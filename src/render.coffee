_ = require("underscore")
str = require("underscore.string")
async = require("async")
utils = require("./utils")
codeFilter = require("./codeFilter")
marked = require("marked")
fs = require("fs")
beautifyJs = require('js-beautify')
beautifyCss = require('js-beautify').css
beautifyHtml = require('js-beautify').html

# Render assets
#
# TODO output as separate files for server side testing
renderAssets = (id, assets, layout, iframeAttributes, cb) ->
  idOrig = id
  id = id.toLowerCase()
  assetId = 0
  tabLinks = ""
  tabDivs = ""
  assetsTemplate = """
     <div id="{{{id}}}_tabs" class="tabs">
       <ul>
         {{{tabLinks}}}
       </ul>
     </div>
     <div id="{{{id}}}_tabs_content" class="tabs_content">
       {{{tabDivs}}}
     </div>
   """

  linkFirstTemplate = """
    <li class="active">
      <a href="\#{{{idname}}}-tab" rel="{{{idname}}}-tab">
        {{{name}}}
      </a>
    </li>
  """
  linkTemplate = """
    <li>
      <a href="\#{{{idname}}}-tab" rel="{{{idname}}}-tab">
        {{{name}}}
      </a>
    </li>
  """
  tabTemplate = """
    <div id="{{{idname}}}-tab" class="tab_content">
      {{{content}}}
    </div>
  """


  # prepend result tab
  tabLinks = _.template(linkFirstTemplate, id: id, name: "result", idname: id + "result")
  tabDivs =  _.template(tabTemplate, {
    id: id
    name: "result"
    idname: str.slugify(id + "result")
    content: """<iframe id="#{id}" src="_assets/#{idOrig}.html" class="result" #{iframeAttributes}></iframe>"""
  })

  codeTemplate = """<pre><code class="language-{{{lang}}}">{{{code}}}</code></pre>"""

  processAsset = (name, cb) ->
    idname = str.slugify(id + name)
    tabLinkTemplate = if tabLinks.length is 0 then linkFirstTemplate else linkTemplate
    tabLinks += _.template(tabLinkTemplate, {id, name, idname})
    content = assets[name]

    saveResult = (lang) ->
      return (err, result) ->
        return cb(err) if err
        code = _.template(codeTemplate, {code:result, lang})
        tabDivs += _.template(tabTemplate, {id, content: code, name, idname})
        cb()

    if name is "code" or str.endsWith(name, ".js")
      content = beautifyJs(content, indent_size: 2)
      content = codeFilter(content, {language: "js"}, saveResult('js'))
    else if name  is "markup" or str.endsWith(name, ".html")
      content = _.template(layout, {markup: content, id})
      content = beautifyHtml(content, indent_size: 2)
      content = codeFilter(content, {language: "html"}, saveResult('html'))
    else if name is "style" or str.endsWith(name, ".css")
      content = beautifyCss(content, indent_size: 2)
      content = codeFilter(content, {language: "css"}, saveResult("css"))

  async.forEach Object.keys(assets), processAsset, (err) ->
    return cb(err) if err

    result = _.template(assetsTemplate, {id, tabLinks, tabDivs})
    cb null, result


# Returns an iframe token to be inserted into documented.  Iframe's do not load without a 'src' element.
# The return script must be executed by the main page to load the iframe.
exports.renderExample = (section, layout, cb) ->
  {id, assets} = section
  exampleRegex = /^{{{EXAMPLE([^}]*)}}}/
  iframeAttributes = ""

  # replace {{{EXAMPLE}}} token or append it
  _.find section.tokens, (tok) ->
    result = false
    if tok.type != 'code'
      matches = tok.text?.match(exampleRegex)
      if matches
        iframeAttributes = matches[1]
        result = true
    result

  renderAssets id, assets, layout, iframeAttributes, (err, html) ->
    return cb(err) if (err)

    token = utils.rawToken(html)
    page = _.template(layout, {markup: assets['markup.html'], iframeAttributes, id})
    cb null, [token, page]


parse = (tokens) ->
  options =
    gfm: true
    tables: true
    breaks: false
    pedantic: false
    sanitize: false
    smartLists: true
    langPrefix: ""

  marked.Parser.parse(tokens, options)


exports.renderTokens = (tokens, cb) ->
  # Satisfies marked interface
  if not tokens.links
    tokens.links = []

  codeTokens = _.filter tokens, (token) ->
    token?.type == "code"

  filterCode = (token, cb) ->
    codeFilter token.text, {language: token.lang}, (err, result) ->
      return cb(err) if err

      if _.isString(result)
        token.text = result
        token.escaped = true
      else if _.isObject(result)
        _.extend token, result
        token.escaped = true

      # drops extra arguments "js --hide", keeping only "js"
      if token.lang
        token.lang = token.lang.split(/\s/)[0]

      cb()

  async.forEach codeTokens, filterCode, (err) ->
    return cb(err) if err
    cb null, parse(tokens)


