var DefaultRenderer, changeExtname, fs, main, npath, parseArgs, pkg, program, renderFile, _;

fs = require("fs");

program = require("commander");

pkg = require("../package.json");

npath = require("path");

_ = require("underscore");

DefaultRenderer = require("./defaultRenderer");

changeExtname = function(filename, extname) {
  var basename, dirname;
  dirname = npath.dirname(filename);
  basename = npath.basename(filename, npath.extname(filename));
  return npath.join(dirname, basename + extname);
};

parseArgs = function() {
  return program.version(pkg.version).usage("[options] tutdown_file").option("-o, --output-file [outputFile]", "Output file").option("-l, --layout-file [layoutFile]", "Layout file", __dirname + "/templates/html.hbs").parse(process.argv);
};

renderFile = function(inputFilename, outputFilename, layoutFile, cb) {
  var assetPrefix, assetsDirname, renderer;
  assetsDirname = npath.join(npath.dirname(npath.resolve(outputFilename)), 'assets');
  assetPrefix = npath.basename(inputFilename, npath.extname(inputFilename));
  renderer = new DefaultRenderer({
    assetsDirname: assetsDirname,
    assetPrefix: assetPrefix,
    docLayoutFile: layoutFile
  });
  return fs.readFile(inputFilename, "utf8", function(err, markdown) {
    if (err) {
      return cb(err);
    }
    return renderer.render(markdown, function(err, html) {
      if (err) {
        return cb(err);
      }
      return fs.writeFile(outputFilename, html, cb);
    });
  });
};

main = function() {
  var filename, outputFile, prog;
  prog = parseArgs();
  if (!(prog.args.length > 0)) {
    prog.outputHelp();
    process.exit(1);
  }
  filename = npath.resolve(prog.args[0]);
  outputFile = prog.outputFile || changeExtname(filename, '.html');
  return renderFile(filename, outputFile, prog.layoutFile, function(err) {
    if (err) {
      console.error(err);
      return process.exit(1);
    } else {
      console.log("Created ", outputFile);
      return process.exit(0);
    }
  });
};

main();


/*
//@ sourceMappingURL=command.map
*/