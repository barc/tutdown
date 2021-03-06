var filter, filters, fs, hjs, npath, setImmediate, spawn, temp, utils, _;

spawn = require("child_process").spawn;

fs = require("fs");

hjs = require("highlight.js");

temp = require("temp");

npath = require("path");

utils = require("./utils");

_ = require("underscore");

setImmediate = function(fn) {
  return process.nextTick(fn);
};

filters = {
  js: function(source, options, cb) {
    var highlighted;
    highlighted = hjs.highlight("javascript", source).value;
    if (cb) {
      return cb(null, highlighted);
    } else {
      return highlighted;
    }
  },
  css: function(source, options, cb) {
    return setImmediate(function() {
      var highlighted;
      highlighted = hjs.highlight("css", source).value;
      return cb(null, highlighted);
    });
  },
  html: function(source, options, cb) {
    return setImmediate(function() {
      var highlighted;
      highlighted = hjs.highlight("html", source).value;
      return cb(null, highlighted);
    });
  },
  umlSvg: function(source, options, cb) {
    var outfile, pumlfile, title;
    title = options.title || "";
    pumlfile = temp.path({
      prefix: "tutdown-",
      suffix: ".puml"
    });
    outfile = temp.path({
      prefix: "tutdown-",
      suffix: ".utf8"
    });
    return setImmediate(function() {
      var uml;
      uml = _.template(options.template, {
        filename: npath.basename(outfile),
        source: source
      });
      return fs.writeFile(pumlfile, uml, "utf8", function(err) {
        var cmd, jarfile;
        if (err) {
          return cb(err);
        }
        jarfile = npath.resolve(__dirname + "/../bin/plantuml.jar");
        cmd = spawn("java", ["-jar", jarfile, "-tsvg", "-o", npath.dirname(outfile), pumlfile]);
        cmd.stdout.on("data", function(data) {
          return console.log("" + data);
        });
        cmd.stderr.on("data", function(data) {
          return console.log("" + data);
        });
        cmd.on("error", function(err) {
          return console.error("Java not found. UML diagrams will not be generated.");
        });
        return cmd.on("close", function(code) {
          if (code !== 0) {
            console.error("Could not create UML diagram. Is Java installed?");
            return cb(null, {
              type: "code",
              text: source
            });
          } else {
            return fs.readFile(outfile, "utf8", function(err, content) {
              if (err) {
                return cb(err);
              }
              return cb(null, {
                type: "code",
                text: content
              });
            });
          }
        });
      });
    });
  },
  umlUtf8: function(source, options, cb) {
    var outfile, pumlfile, title;
    title = options.title || "";
    pumlfile = temp.path({
      prefix: "tutdown-",
      suffix: ".puml"
    });
    outfile = temp.path({
      prefix: "tutdown-",
      suffix: ".utf8"
    });
    return setImmediate(function() {
      var uml;
      uml = "@startuml " + (npath.basename(outfile)) + "\n" + source + "\n@enduml";
      return fs.writeFile(pumlfile, uml, "utf8", function(err) {
        var cmd, jarfile;
        if (err) {
          return cb(err);
        }
        jarfile = npath.resolve(__dirname + "/../bin/plantuml.jar");
        cmd = spawn("java", ["-jar", jarfile, "-tutxt", "-o", npath.dirname(outfile), pumlfile]);
        cmd.stdout.on("data", function(data) {
          return console.log("" + data);
        });
        cmd.stderr.on("data", function(data) {
          return console.log("" + data);
        });
        cmd.on("error", function(err) {
          return console.error("Java not found. UML diagrams will not be generated.");
        });
        return cmd.on("close", function(code) {
          if (code !== 0) {
            console.error("Could not create UML diagram. Is Java installed?");
            return cb(null, {
              type: "code",
              text: source
            });
          } else {
            return fs.readFile(outfile, "utf8", function(err, content) {
              if (err) {
                return cb(err);
              }
              return cb(null, {
                type: "code",
                text: content
              });
            });
          }
        });
      });
    });
  }
};

filters.uml = filters.umlSvg;

filters.javascript = filters.js;

filters.xml = filters.html;

filter = function(source, options, cb) {
  filter = filters[options.language];
  if (filter) {
    if (cb) {
      return filter(source, options, cb);
    } else {
      return filter(source, options);
    }
  } else {
    if (cb) {
      return cb(null);
    } else {
      return null;
    }
  }
};

module.exports = filter;


/*
//@ sourceMappingURL=codeFilter.map
*/