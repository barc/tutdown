/**
 * Copyright (c) 2013 Mario L Gutierrez
 */
(function() {
  var ExampleSection, async, beginAssetSubTemplate, beginSectionTemplate, codeFilter, endAssetSubTemplate, endSectionTemplate, exampleId, str, utils, _;

  utils = require("../utils");

  _ = require('underscore');

  codeFilter = require("../codeFilter");

  str = require("underscore.string");

  async = require("async");

  beginSectionTemplate = "<div class='section-example'>";

  endSectionTemplate = "</div>";

  beginAssetSubTemplate = "<div id=\"{{{id}}}-{{{name}}}tab\" class=\"tab_content\">";

  endAssetSubTemplate = "</div>";

  exampleId = 0;

  ExampleSection = (function() {
    var rawToken, renderAssets, resultContent;

    function ExampleSection(token) {
      this.id = "ex" + exampleId++;
      this.tokens = [];
      this.tokens.push(rawToken(_.template(beginSectionTemplate, {
        id: this.id
      })));
      this.currentAsset = null;
      this.code = "";
      this.style = "";
      this.markup = "";
      this.navLinks = null;
      this.preTokens = [];
      this.assets = [];
    }

    ExampleSection.begin = function(token) {
      var section;

      return section = new ExampleSection(token);
    };

    ExampleSection.prototype.beginAsset = function(name) {
      this.closeAsset();
      this.currentAsset = name;
      return rawToken(_.template(beginAssetSubTemplate, {
        id: this.id,
        name: name
      }));
    };

    ExampleSection.prototype.closeAsset = function() {
      if (this.currentAsset && !this.isMeta()) {
        this.tokens.push(rawToken("</div>"));
        return this.currentAsset = null;
      }
    };

    ExampleSection.prototype.end = function(token, cb) {
      var that;

      this.closeAsset();
      that = this;
      return resultContent(this.id, this.assets, function(err, result) {
        if (err) {
          return cb(err);
        }
        token = result[0], that.docScript = result[1];
        that.tokens.push(token);
        token = rawToken("</div>");
        that.tokens.push(token);
        that.tokens = that.preTokens.concat(that.tokens);
        return cb();
      });
    };

    ExampleSection.prototype.isMeta = function() {
      return this.currentAsset === ":::meta";
    };

    ExampleSection.prototype.setAsset = function(name, text) {
      return this.assets[name] = text;
    };

    ExampleSection.prototype.appendAsset = function(name, text, separator) {
      if (this.assets[name]) {
        return this.assets[name] += "\n" + text;
      } else {
        return this.assets[name] = text;
      }
    };

    ExampleSection.prototype.push = function(token) {
      var args, depth, div, hide, idx, lang, language, name, noCapture, parts, text, type;

      type = token.type, text = token.text, lang = token.lang, depth = token.depth;
      if (lang == null) {
        lang = "";
      }
      lang = lang.trim();
      hide = false;
      if (type === "heading" && !this.navLinks) {
        this.navLinks = [];
        this.navLinks.push({
          id: this.id,
          type: "example",
          title: text
        });
      }
      if (type === "heading" && text === ":::meta") {
        div = this.beginAsset(text.toLowerCase());
        if (!this.isMeta()) {
          this.tokens.push(div);
        }
      } else if (this.isMeta()) {
        if (type === "code") {
          switch (lang) {
            case "layout":
              this.layoutTemplate = text;
              break;
            case "scripts":
              this.preScripts += text;
          }
        }
      } else if (type === "code") {
        parts = utils.parseLineArgs(lang);
        language = parts[0];
        args = parts.slice(1) || [];
        noCapture = args.indexOf('--no-capture') > -1;
        hide = args.indexOf('--hide') > -1;
        if (!noCapture) {
          idx = args.indexOf(">");
          if (idx > -1 && (name = args[idx + 1])) {
            this.setAsset(name, text);
          } else {
            idx = args.indexOf(">>");
            if (idx > -1 && (name = args[idx + 1])) {
              this.appendAsset(name, text);
            } else if (language === "js" || language === "javascript") {
              this.appendAsset("code", text);
            } else if (language === "html") {
              this.appendAsset("markup", text);
            } else if (language === "css") {
              this.appendAsset("style", text);
            }
          }
        }
      }
      if (!(hide || this.isMeta())) {
        return this.tokens.push(token);
      }
    };

    rawToken = function(text) {
      return {
        type: "html",
        pre: true,
        text: text
      };
    };

    renderAssets = function(id, assets, cb) {
      var assetId, assetsTemplate, codeTemplate, linkFirstTemplate, linkTemplate, tabDivs, tabLinks, tabTemplate;

      assetId = 0;
      tabLinks = "";
      tabDivs = "";
      assetsTemplate = "<h3>Assets</h3>\n<div id=\"{{{id}}}_tabs\" class=\"tabs\">\n  <ul>\n    {{{tabLinks}}}\n  </ul>\n</div>\n<div id=\"{{{id}}}_tabs_content\" class=\"tabs_content\">\n  {{{tabDivs}}}\n</div>";
      linkFirstTemplate = "<li class=\"active\"><a href=\"\#{{{idname}}}-tab\" rel=\"{{{idname}}}-tab\">{{{name}}}</a></li>";
      linkTemplate = "<li><a href=\"\#{{{idname}}}-tab\" rel=\"{{{idname}}}-tab\">{{{name}}}</a></li>";
      tabTemplate = "<div id=\"{{{idname}}}-tab\" class=\"tab_content\">{{{content}}}</div>";
      tabLinks = _.template(linkFirstTemplate, {
        id: id,
        name: "result",
        idname: id + "result"
      });
      tabDivs = _.template(tabTemplate, {
        id: id,
        name: "result",
        idname: str.slugify(id + "result"),
        content: "<iframe id=\"" + id + "\" class=\"result\"></iframe>"
      });
      codeTemplate = "<pre><code class=\"language-{{{lang}}}\">{{{code}}}</code></pre>";
      return async.forEach(Object.keys(assets), function(name, cb) {
        var content, idname, saveResult, tabLinkTemplate;

        idname = str.slugify(id + name);
        tabLinkTemplate = tabLinks.length === 0 ? linkFirstTemplate : linkTemplate;
        tabLinks += _.template(tabLinkTemplate, {
          id: id,
          name: name,
          idname: idname
        });
        content = assets[name];
        saveResult = function(lang) {
          return function(err, result) {
            var code;

            if (err) {
              return cb(err);
            }
            code = _.template(codeTemplate, {
              code: result,
              lang: lang
            });
            tabDivs += _.template(tabTemplate, {
              id: id,
              content: code,
              name: name,
              idname: idname
            });
            return cb();
          };
        };
        if (name === "code" || str.endsWith(name, ".js")) {
          return content = codeFilter(content, "js", saveResult('js'));
        } else if (name === "markup" || str.endsWith(name, ".html")) {
          return content = codeFilter(content, "html", saveResult('html'));
        } else if (name === "style" || str.endsWith(name, ".css")) {
          return content = codeFilter(content, "css", saveResult("css"));
        }
      }, function(err) {
        var result;

        if (err) {
          return cb(err);
        }
        result = _.template(assetsTemplate, {
          id: id,
          tabLinks: tabLinks,
          tabDivs: tabDivs
        });
        return cb(null, result);
      });
    };

    resultContent = function(id, assets, cb) {
      var codeTemplate, docScriptTemplate, layoutTemplate, resultAssetTemplate, styleTemplate;

      resultAssetTemplate = "{{{assets}}}";
      codeTemplate = "<script>(function() {\n  {{{code}}}\n})();\n</script>";
      styleTemplate = "<style type=\"text/css\">\n  {{{style}}}\n</style>";
      layoutTemplate = this.layoutTemplate || "<html>\n  <head>\n    {{{style}}}\n  </head>\n  <body>\n    {{{markup}}}\n    {{{code}}}\n  </body>\n</html>";
      docScriptTemplate = "(function() {\n  var target = document.getElementById('{{{id}}}').contentDocument;\n  target.open();\n  target.write({{{page}}});\n  target.close();\n})();";
      return renderAssets(id, assets, function(err, html) {
        var code, docScript, page, style, token;

        if (err) {
          return cb(err);
        }
        token = rawToken(_.template(resultAssetTemplate, {
          id: id,
          assets: html
        }));
        code = _.template(codeTemplate, {
          code: assets.code
        });
        style = _.template(styleTemplate, {
          style: assets.style
        });
        page = _.template(layoutTemplate, {
          markup: assets.markup,
          style: style,
          code: code
        });
        docScript = _.template(docScriptTemplate, {
          id: id,
          page: utils.escapeMultilineJsString(page)
        });
        return cb(null, [token, docScript]);
      });
    };

    return ExampleSection;

  })();

  module.exports = ExampleSection;

}).call(this);
