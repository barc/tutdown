/**
 * Copyright (c) 2013 Mario L Gutierrez
 */
(function() {
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
      this.options = options != null ? options : {};
      this.renderSection = __bind(this.renderSection, this);
      if (!this.options.assetsDirname) {
        throw new Error('options.assetsDirname is required');
      }
      _.defaults(this.options, {
        docStylesheetFile: __dirname + '/../lib/assets/style.css',
        docScriptFile: __dirname + '/../src/assets/tabs.js',
        exampleLayoutFile: __dirname + '/../src/templates/example.hbs'
      });
      this.docScript = fs.readFileSync(this.options.docScriptFile, "utf8");
      this.docStylesheet = fs.readFileSync(this.options.docStylesheetFile, "utf8");
      this.exampleLayout = fs.readFileSync(this.options.exampleLayoutFile, "utf8");
      if (this.options.docLayoutFile) {
        this.docLayout = fs.readFileSync(this.options.docLayoutFile, "utf8");
      } else {
        this.docLayout = "{{{document}}}";
      }
      mkdir(this.options.assetsDirname);
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
      var dirname, exampleLayout;
      dirname = this.options.assetsDirname;
      exampleLayout = this.exampleLayout;
      return this.persistAssets(section, function(err) {
        if (err) {
          return cb(err);
        }
        return render.renderExample(section, exampleLayout, function(err, result) {
          var filename, page, token;
          if (err) {
            return cb(err);
          }
          token = result[0], page = result[1];
          filename = npath.join(dirname, "" + section.id + ".html");
          return fs.writeFile(filename, page, function(err) {
            var found;
            if (err) {
              return cb(err);
            }
            found = _.find(section.tokens, function(tok) {
              return tok.text === '{{{EXAMPLE}}}' && tok.type !== 'code';
            });
            if (found) {
              _.extend(found, token);
            } else {
              section.tokens.push(token);
            }
            return render.renderTokens(section.tokens, function(err, html) {
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
      return cb(null, _.template(this.docLayout, {
        document: html,
        script: script,
        navLinks: navLinks
      }));
    };

    DefaultRenderer.prototype._render = function(tokens, sections, cb) {
      var self;
      self = this;
      return render.renderTokens(tokens, function(err, template) {
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
      tutdown = new Tutdown();
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

}).call(this);
