/**
 * Copyright (c) 2013 Mario L Gutierrez
 */
(function() {
  var async, codeFilter, rawToken, renderAssets, str, utils, _;

  _ = require("underscore");

  str = require("underscore.string");

  async = require("async");

  utils = require("../utils");

  codeFilter = require("../codeFilter");

  rawToken = function(text) {
    return {
      type: "html",
      pre: true,
      text: text
    };
  };

  renderAssets = function(id, assets, cb) {
    var assetId, assetsTemplate, codeTemplate, linkFirstTemplate, linkTemplate, processAsset, tabDivs, tabLinks, tabTemplate;

    assetId = 0;
    tabLinks = "";
    tabDivs = "";
    assetsTemplate = "<h3>Assets</h3>\n<div id=\"{{{id}}}_tabs\" class=\"tabs\">\n  <ul>\n    {{{tabLinks}}}\n  </ul>\n</div>\n<div id=\"{{{id}}}_tabs_content\" class=\"tabs_content\">\n  {{{tabDivs}}}\n</div>";
    linkFirstTemplate = "<li class=\"active\">\n  <a href=\"\#{{{idname}}}-tab\" rel=\"{{{idname}}}-tab\">\n    {{{name}}}\n  </a>\n</li>";
    linkTemplate = "<li>\n  <a href=\"\#{{{idname}}}-tab\" rel=\"{{{idname}}}-tab\">\n    {{{name}}}\n  </a>\n</li>";
    tabTemplate = "<div id=\"{{{idname}}}-tab\" class=\"tab_content\">\n  {{{content}}}\n</div>";
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
    processAsset = function(name, cb) {
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
    };
    return async.forEach(Object.keys(assets), processAsset, function(err) {
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

  exports.resultContent = function(id, assets, cb) {
    var codeTemplate, docScriptTemplate, layoutTemplate, resultAssetTemplate, styleTemplate;

    resultAssetTemplate = "{{{assets}}}";
    codeTemplate = "<script>(function() {\n  {{{code}}}\n  })();\n</script>";
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

  exports.renderTokens = function(tokens, cb) {
    var codeTokens, filterCode;

    codeTokens = _.filter(tokens, function(token) {
      return (token != null ? token.type : void 0) === "code";
    });
    filterCode = function(token, cb) {
      return codeFilter(token.text, token.lang, function(err, result) {
        if (err) {
          return cb(err);
        }
        if (_.isString(result)) {
          token.text = result;
          token.escaped = true;
        } else if (_.isObject(result)) {
          _.extend(token, result);
          token.escaped = true;
        }
        if (token.lang) {
          token.lang = token.lang.split(/\s/)[0];
        }
        return cb();
      });
    };
    return async.forEach(codeTokens, filterCode, function(err) {
      if (err) {
        return cb(err);
      }
      return cb(null, parse(tokens));
    });
  };

}).call(this);
