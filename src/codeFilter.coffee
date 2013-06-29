{spawn} = require("child_process")
fs = require("fs")
hjs = require("highlight.js")
temp = require("temp")
npath = require("path")
utils = require("./utils")

setImmediate = (fn) ->
  process.nextTick fn

filters =
  # Highlights JavaScript code
  js: (source, options, cb) ->
    setImmediate ->
      highlighted = hjs.highlight("javascript", source).value
      cb null, highlighted


  # Highlights CSS code
  css: (source, options, cb) ->
    setImmediate ->
      highlighted = hjs.highlight("css", source).value
      cb null, highlighted

  # Highlights HTML code
  html: (source, options, cb) ->
    setImmediate ->
      highlighted = hjs.highlight("xml", source).value
      cb null, highlighted

  # Creates UT8 Diagrams from PlantUML
  uml: (source, args, cb) ->
    title = args[0] || ""

    pumlfile = temp.path(prefix: "tutdown-", suffix: ".puml")
    outfile = temp.path(prefix: "tutdown-", suffix: ".utf8")
    # filename = "1.png"
    setImmediate ->
      uml = """
        @startuml #{npath.basename(outfile)}
        #{source}
        @enduml
      """

      # TODO can't make pipes work, shouldn't have to create a temporary file
      fs.writeFile pumlfile, uml, "utf8", (err) ->
        return cb(err) if err

        jarfile = npath.resolve(__dirname + "/../bin/plantuml 2.jar")

        cmd = spawn("java", ["-jar", jarfile, "-tutxt", "-o", npath.dirname(outfile),  pumlfile])

        cmd.stdout.on "data", (data) ->
          console.log "" + data

        cmd.stderr.on "data", (data) ->
          console.log "" + data

        cmd.on "error", (err) ->
          console.error "Java not found. UML diagrams will not be generated."

        cmd.on "close", (code) ->
          if code isnt 0
            console.error "Could not create UML diagram. Is Java installed?"
            return cb null, type: "code", text: source
          else
            #fs.unlinkSync pumlfile
            fs.readFile outfile, "utf8", (err, content) ->
              return cb(err) if err
              #fs.unlinkSync outfile
              cb null, type: "code", text: content

filters.javascript = filters.js
filters.xml = filters.html

filter = (source, language, cb) ->
  if language
    language = language.trim()
    parts = utils.parseLineArgs language
    if parts.length > 0
      language = parts[0]
      args = parts.slice(1)

  filter = filters[language]
  if filter
    filter source, args, cb
  else
    cb null

module.exports = filter

