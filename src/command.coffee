fs = require("fs")
program = require("commander")
pkg = require("../package.json")
npath = require("path")
_ = require("underscore")
DefaultRenderer = require("./defaultRenderer")

# Change the extension of filename.
changeExtname = (filename, extname) ->
  dirname = npath.dirname(filename)
  basename = npath.basename(filename, npath.extname(filename))
  npath.join(dirname, basename + extname)

# Parse CLI args.
parseArgs = ->
  program
    .version(pkg.version)
    .usage("[options] tutdown_file")
    .option("-o, --output-file [outputFile]", "Output file")
    .option("-l, --layout-file [layoutFile]", "Layout file", __dirname + "/templates/html.hbs")
    .parse process.argv


# Renders HTML file from Tutdown markup.
renderFile = (inputFilename, outputFilename, layoutFile, cb) ->
  # Write assets relative to file in _assets folder
  assetsDirname = npath.join(npath.dirname(npath.resolve(outputFilename)), 'assets')
  assetPrefix = npath.basename(inputFilename, npath.extname(inputFilename))
  renderer = new DefaultRenderer({assetsDirname, assetPrefix, docLayoutFile: layoutFile})

  fs.readFile inputFilename, "utf8", (err, markdown) ->
    return cb(err) if err

    renderer.render markdown, (err, html) ->
      return cb(err) if err
      fs.writeFile outputFilename, html, cb


# Entry point into app.
main = ->
  prog = parseArgs()
  unless prog.args.length > 0
    prog.outputHelp()
    process.exit 1

  filename = npath.resolve(prog.args[0])
  outputFile = prog.outputFile || changeExtname(filename, '.html')
  renderFile filename, outputFile, prog.layoutFile, (err) ->
    if err
      console.error err
      process.exit 1
    else
      console.log "Created ", outputFile
      process.exit 0

main()
