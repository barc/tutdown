/**
 * Copyright (c) 2013 Mario L Gutierrez
 */
(function() {
  var async, beautifyCss, beautifyHtml, beautifyJs, codeFilter, fs, marked, parse, renderAssets, str, utils, _;

  _ = require("underscore");

  str = require("underscore.string");

  async = require("async");

  utils = require("./utils");

  codeFilter = require("./codeFilter");

  marked = require("marked");

  fs = require("fs");

  beautifyJs = require('js-beautify');

  beautifyCss = require('js-beautify').css;

  beautifyHtml = require('js-beautify').html;

  renderAssets = function(id, assets, layout, iframeAttributes, cb) {
    var assetId, assetsTemplate, codeTemplate, linkFirstTemplate, linkTemplate, processAsset, tabDivs, tabLinks, tabTemplate;
    id = id.toLowerCase();
    assetId = 0;
    tabLinks = "";
    tabDivs = "";
    assetsTemplate = "<div id=\"{{{id}}}_tabs\" class=\"tabs\">\n  <ul>\n    {{{tabLinks}}}\n  </ul>\n</div>\n<div id=\"{{{id}}}_tabs_content\" class=\"tabs_content\">\n  {{{tabDivs}}}\n</div>";
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
      content: "<iframe id=\"" + id + "\" src=\"_assets/" + id + ".html\" class=\"result\" " + iframeAttributes + "></iframe>"
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
        content = beautifyJs(content, {
          indent_size: 2
        });
        return content = codeFilter(content, "js", saveResult('js'));
      } else if (name === "markup" || str.endsWith(name, ".html")) {
        content = _.template(layout, {
          markup: content,
          id: id
        });
        content = beautifyHtml(content, {
          indent_size: 2
        });
        return content = codeFilter(content, "html", saveResult('html'));
      } else if (name === "style" || str.endsWith(name, ".css")) {
        content = beautifyCss(content, {
          indent_size: 2
        });
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

  exports.renderExample = function(section, layout, cb) {
    var assets, exampleRegex, id, iframeAttributes;
    id = section.id, assets = section.assets;
    exampleRegex = /^{{{EXAMPLE([^}]*)}}}/;
    iframeAttributes = "";
    _.find(section.tokens, function(tok) {
      var matches, result, _ref;
      result = false;
      if (tok.type !== 'code') {
        matches = (_ref = tok.text) != null ? _ref.match(exampleRegex) : void 0;
        if (matches) {
          iframeAttributes = matches[1];
          result = true;
        }
      }
      return result;
    });
    return renderAssets(id, assets, layout, iframeAttributes, function(err, html) {
      var page, token;
      if (err) {
        return cb(err);
      }
      token = utils.rawToken(html);
      page = _.template(layout, {
        markup: assets['markup.html'],
        iframeAttributes: iframeAttributes,
        id: id
      });
      return cb(null, [token, page]);
    });
  };

  parse = function(tokens) {
    var options;
    options = {
      gfm: true,
      tables: true,
      breaks: false,
      pedantic: false,
      sanitize: false,
      smartLists: true,
      langPrefix: ""
    };
    return marked.Parser.parse(tokens, options);
  };

  exports.renderTokens = function(tokens, cb) {
    var codeTokens, filterCode;
    if (!tokens.links) {
      tokens.links = [];
    }
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
