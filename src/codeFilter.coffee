{spawn} = require("child_process")
fs = require("fs")
hjs = require("highlight.js")
temp = require("temp")
npath = require("path")
utils = require("./utils")
_ = require("underscore")


umlSvgTemplate = fs.readFileSync("#{__dirname}/../src/templates/uml.mustache", "utf8")

setImmediate = (fn) ->
  process.nextTick fn

filters =
  # Highlights JavaScript code
  js: (source, options, cb) ->
    highlighted = hjs.highlight("javascript", source).value
    if cb
      return cb(null, highlighted)
    else
      return highlighted


  # Highlights CSS code
  css: (source, options, cb) ->
    setImmediate ->
      highlighted = hjs.highlight("css", source).value
      cb null, highlighted

  # Highlights HTML code
  html: (source, options, cb) ->
    setImmediate ->
      highlighted = hjs.highlight("html", source).value
      cb null, highlighted


  # Creates UT8 Diagrams from PlantUML
  umlSvg: (source, options, cb) ->
    title = options.title || ""

    pumlfile = temp.path(prefix: "tutdown-", suffix: ".puml")
    outfile = temp.path(prefix: "tutdown-", suffix: ".utf8")
    # filename = "1.png"
    setImmediate ->
      uml = _.template(umlSvgTemplate, filename: npath.basename(outfile), source: source)

      # TODO can't make pipes work, shouldn't have to create a temporary file
      fs.writeFile pumlfile, uml, "utf8", (err) ->
        return cb(err) if err

        jarfile = npath.resolve(__dirname + "/../bin/plantuml.jar")

        cmd = spawn("java", ["-jar", jarfile, "-tsvg", "-o", npath.dirname(outfile),  pumlfile])

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


  # Creates UT8 Diagrams from PlantUML
  umlUtf8: (source, options, cb) ->
    title = options.title || ""

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

        jarfile = npath.resolve(__dirname + "/../bin/plantuml.jar")

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

filters.uml = filters.umlSvg

filters.javascript = filters.js
filters.xml = filters.html

# TODO: Sync is only safe with `js`, made doxdown work
filter = (source, options, cb) ->
  filter = filters[options.language]
  if filter
    if cb
        filter source, options, cb
    else
        filter source, options
  else
    if cb
      cb null
    else
      null

module.exports = filter

