var DefaultRenderer, Tutdown, async, fs, mkdir, npath, render, _,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

fs = require("fs");

render = require("./render");

async = require("async");

_ = require("underscore");

npath = require("path");

Tutdown = require("./tutdown");

mkdir = function(dirname) {
  if (!fs.existsSync(dirname)) {
    return fs.mkdir(dirname);
  }
};

DefaultRenderer = (function() {
  function DefaultRenderer(options) {
    var _ref, _ref1;
    this.options = options != null ? options : {};
    this.renderSection = __bind(this.renderSection, this);
    if (!this.options.assetsDirname) {
      throw new Error('options.assetsDirname is required');
    }
    _.defaults(this.options, {
      docStylesheetFile: __dirname + '/../lib/assets/style.css',
      docScriptFile: __dirname + '/../src/assets/tabs.js'
    });
    this.docScript = fs.readFileSync(this.options.docScriptFile, "utf8");
    this.docStylesheet = fs.readFileSync(this.options.docStylesheetFile, "utf8");
    this.exampleLayout = ((_ref = this.options.templates) != null ? _ref.example : void 0) || fs.readFileSync(__dirname + '/../src/templates/example.hbs', 'utf8');
    if (this.options.docLayoutFile) {
      this.docLayout = fs.readFileSync(this.options.docLayoutFile, "utf8");
    } else {
      this.docLayout = "{{{document}}}";
    }
    mkdir(this.options.assetsDirname);
    this.umlTemplate = ((_ref1 = this.options.templates) != null ? _ref1.uml : void 0) || fs.readFileSync("" + __dirname + "/../src/templates/uml.mustache", "utf8");
  }

  DefaultRenderer.prototype.persistAssets = function(section, cb) {
    var dirname, writeAsset;
    dirname = this.options.assetsDirname;
    writeAsset = function(name, cb) {
      var content;
      content = section.assets[name];
      return fs.writeFile(npath.join(dirname, "" + section.id + "-" + name), content, cb);
    };
    return async.forEach(_.keys(section.assets), writeAsset, cb);
  };

  DefaultRenderer.prototype.renderSection = function(section, cb) {
    var dirname, that;
    dirname = this.options.assetsDirname;
    that = this;
    return this.persistAssets(section, function(err) {
      var opts;
      if (err) {
        return cb(err);
      }
      opts = {
        templates: {
          example: that.exampleLayout,
          uml: that.umlTemplate
        },
        assetsDirname: dirname
      };
      return render.renderExample(section, opts, function(err, result) {
        var exampleRegex, filename, page, token;
        if (err) {
          return cb(err);
        }
        exampleRegex = /^{{{EXAMPLE([^}]*)}}}/;
        token = result[0], page = result[1];
        filename = npath.join(dirname, "" + section.id + ".html");
        return fs.writeFile(filename, page, function(err) {
          var found;
          if (err) {
            return cb(err);
          }
          found = _.find(section.tokens, function(tok) {
            var _ref;
            return tok.type !== 'code' && ((_ref = tok.text) != null ? _ref.match(exampleRegex) : void 0);
          });
          if (found) {
            _.extend(found, token);
          } else {
            section.tokens.push(token);
          }
          return render.renderTokens(section.tokens, opts, function(err, html) {
            if (err) {
              return cb(err);
            }
            section.html = html;
            return cb();
          });
        });
      });
    });
  };

  DefaultRenderer.prototype.toHtml = function(result, cb) {
    var assetsDirname, html, navLinks, script, stylesheet;
    html = result.html, script = result.script, navLinks = result.navLinks;
    assetsDirname = this.options.assetsDirname;
    if (!this.docStylesheetWritten) {
      this.docStylesheetWritten = true;
      stylesheet = npath.join(assetsDirname, 'tutdown.css');
      fs.writeFileSync(stylesheet, this.docStylesheet);
    }
    if (!this.docScriptWritten) {
      this.docScriptWritten = true;
      script = npath.join(assetsDirname, 'tutdown.js');
      fs.writeFileSync(script, this.docScript);
    }
    return cb(null, html);
  };

  DefaultRenderer.prototype._render = function(tokens, sections, cb) {
    var opts, self;
    self = this;
    opts = {
      templates: {
        uml: this.umlTemplate
      },
      assetsDirname: this.options.assetsDirname
    };
    return render.renderTokens(tokens, opts, function(err, template) {
      if (err) {
        return cb(err);
      }
      return async.forEach(_.values(sections), self.renderSection, function(err) {
        var result;
        if (err) {
          return cb(err);
        }
        result = {
          html: _.template(template, {
            sections: sections
          }),
          sections: sections
        };
        return self.toHtml(result, cb);
      });
    });
  };

  DefaultRenderer.prototype.render = function(markdown, cb) {
    var self, tutdown;
    self = this;
    tutdown = new Tutdown(this.options);
    return tutdown.process(markdown, function(err, tokens, sections) {
      if (err) {
        return cb(err);
      }
      return self._render(tokens, sections, cb);
    });
  };

  return DefaultRenderer;

})();

module.exports = DefaultRenderer;


/*
//@ sourceMappingURL=defaultRenderer.map
*/