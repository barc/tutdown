fs = require("fs")
coffee = require("coffee-script")
dox = require("dox")
Funcd = require("funcd")
_ = require("underscore")
_.str = require("underscore.string")
utils = require("./utils")
codeFilter = require("./codeFilter")

exports.renderFromFile = (fileName, options = {}, cb) ->
  if typeof options is "function"
    cb = options
    options = {}
  source = fs.readFileSync(fileName, "utf8")
  options.coffeeScript ?= _.str.endsWith(fileName, ".coffee")
  exports.render source, options, cb

exports.render = (source, options = {}, cb) ->
  if typeof options is "function"
    cb = options
    options = {}
  if options.coffeeScript
    js = coffee.compile(source)
    if options.commentFiller?
      js = fixCoffeeComments(js, options.commentFiller)
      #fs.writeFileSync "fixed.js", js
  else
    js = source

  json = dox.parseComments(js)

  if options.debug
    fs.writeFileSync "dox.json", JSON.stringify(json, null, 2)

  exports.renderFromDoxJSON json, options, cb

exports.renderFromDoxJSON = (json, options = {}, cb) ->
  if typeof options is "function"
    cb = options
    options = {}
  content = Funcd.render(createContent, {json, options})
  nav = Funcd.render(createNav, {json, options})
  cb? null, {content, nav}

fixCoffeeComments = (source, commentFiller) ->
  result = []
  L  = commentFiller.length   # Usually `# ` or `* `

  startIndex = -1
  for line in _.str.lines(source)
    if line.match(/^\s+\/\*/)
      startIndex = line.indexOf('/*')
      result.push line
      continue

    if line.match(/^\s+\*\//)
      result.push line
      startIndex = -1
      continue

    if startIndex > -1
      if line.substring(startIndex, startIndex + 2) == commentFiller
        result.push line.slice(0, startIndex) + '* ' + line.slice(startIndex+2)
      else
        result.push line
    else
      result.push line

  result.join "\n"

isStatic = (str) ->
  str.indexOf('.prototype.') < 0 and str.indexOf('this.') < 0


createNav = (t, data) ->
  {json, options} = data
  options ?= {}
  {navHeaderTemplate, navFooterTemplate} = options

  sections = getSections(json)

  for section in sections
    headerItem = _.first(section)
    headerItemName = headerItem.ctx.name
    t.h2 ->
      t.a href:"##{headerItemName}", headerItemName
    t.ul class:"methods", ->
      for item in section.slice(1)
        if item.ctx
          isClassMethod = isStatic(item.ctx.string)
          itemName = item.ctx.name
          t.li ->
            attrs = href:"##{headerItemName}-#{item.ctx.name}"
            attrs.class = "static" if isClassMethod

            t.a attrs, itemName
  null


# Reformats code blocks and removes hard breaks.
#
# TODO: this should not have to be done if dox parses in raw mode,
# refactor code later
reformatDoxDescription = (body) ->
  regex = /(<pre><code>(.|\n)*?)<\/code><\/pre>/gm
  body = body.replace regex, (found, pos) ->
    code =  utils.between(found, '<pre><code>', '</code></pre>')
    code = _.str.unescapeHTML(code)
    code = codeFilter(code, language: 'js')
    "<pre><code>#{code}</code></pre>"
  body = body.replace(/<br \/>/g, ' ')


createContent = (t, data) ->
  {json, options} = data
  options ?= {}
  {contentHeaderTemplate, contentFooterTemplate} = options

  sections = getSections(json)

  for section in sections
    t.section ->
      headerItem = _.first(section)
      headerItemName = headerItem.ctx.name
      t.h2 id:"#{headerItemName}", ->
        t.text headerItemName
        t.span class:"caption", getCaption(headerItem, headerItem)

      t.raw reformatDoxDescription(headerItem.description.full)

      for item in section.slice(1)
        if item.ctx
          isClassMethod = isStatic(item.ctx.string)
          itemName = item.ctx.name
          attrs = id:"#{headerItemName}-#{itemName}"
          if isClassMethod
            attrs.class = "static"
          t.h3 attrs, ->
            t.text itemName
            t.span class:"caption", getCaption(item, headerItem)
        t.raw reformatDoxDescription(item.description.full)
  null


getSections = (json) ->
  sections = []
  for item in json
    if item.ctx?.receiver is "Giraffe"
      sections.push [item]
    else
      _.last(sections).push item
  sections


getCaption = (item, headerItem) ->
  caption = ""

  captionTag = _.find(item.tags, (t) -> t.type is "caption")

  return captionTag.string if captionTag

  if isInstanceMethod(item)
    caption += "#{item.ctx.cons.toLowerCase()}.#{item.ctx.name}"
    caption += getMethodParams(item)
  else if isClass(item, headerItem)
    caption += "new #{item.ctx.string}"
    caption += getMethodParams(item)
  else if isStaticMethod(item, headerItem)
    caption = "#{headerItem.ctx.string}.#{item.ctx.name}"
    caption += getMethodParams(item)
  else if isTopLevelFunction(item, headerItem)
    caption = "#{item.ctx.receiver}.#{item.ctx.name}"
    caption += getMethodParams(item)
  else if isInstanceProperty(item, headerItem)
    caption = "#{headerItem.ctx.name.toLowerCase()}.#{item.ctx.name}"

  caption

isInstanceMethod = (item) ->
  item.ctx.type is "method" and item.ctx.cons

isClass = (item, headerItem) ->
  item is headerItem and
    item.ctx.type is "property" and
    item.ctx.string is "#{item.ctx.receiver}.#{item.ctx.name}" and
    item.ctx.name[0] is item.ctx.name[0].toUpperCase()

isInstanceProperty = (item, headerItem) ->
  !isClass(item, headerItem) and item.ctx.type is "property"

isStaticMethod = (item, headerItem) ->
  item.ctx.type is "method" and
    item.ctx.receiver is headerItem.ctx.name

isTopLevelFunction = (item, headerItem) ->
  item is headerItem and
    item.ctx.type is "method" and
    item.ctx.string is "#{item.ctx.receiver}.#{item.ctx.name}()" and
    item.ctx.name[0] is item.ctx.name[0].toLowerCase()

getMethodParams = (item) ->
  params = "("
  paramCount = 0
  for tag in item.tags
    continue unless tag.type is "param"
    params += ", " if paramCount > 0
    paramCount += 1
    params += tag.name
  params += ")"
  params
