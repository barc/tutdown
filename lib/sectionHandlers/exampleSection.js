/**
 * Copyright (c) 2013 Mario L Gutierrez
 */
(function() {
  var ExampleSection, async, beginAssetSubTemplate, beginSectionTemplate, endAssetSubTemplate, endSectionTemplate, rawToken, str, utils, _;

  utils = require("../utils");

  _ = require('underscore');

  str = require("underscore.string");

  async = require("async");

  beginSectionTemplate = "<div class='section-example'>";

  endSectionTemplate = "</div>";

  beginAssetSubTemplate = "<div id=\"{{{id}}}-{{{name}}}tab\" class=\"tab_content\">";

  endAssetSubTemplate = "</div>";

  rawToken = function(text) {
    return {
      type: "html",
      pre: true,
      text: text
    };
  };

  ExampleSection = (function() {
    function ExampleSection(id, token) {
      this.id = id;
      this.tokens = [];
      this.tokens.push(rawToken(_.template(beginSectionTemplate, {
        id: this.id
      })));
      this.currentAsset = null;
      this.navLinks = null;
      this.preTokens = [];
      this.assets = {};
    }

    ExampleSection.begin = function(id, token) {
      var section;
      return section = new ExampleSection(id, token);
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
      token = rawToken("</div>");
      that.tokens.push(token);
      that.tokens = that.preTokens.concat(that.tokens);
      return cb();
    };

    ExampleSection.prototype.isMeta = function() {
      return this.currentAsset === ":::meta";
    };

    ExampleSection.prototype.setAsset = function(name, text) {
      return this.assets[name] = text;
    };

    ExampleSection.prototype.appendAsset = function(name, text, separator) {
      if (this.assets[name]) {
        return this.assets[name] += "\n\n" + text;
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
              this.appendAsset("script.js", text);
            } else if (language === "html") {
              this.appendAsset("markup.html", text);
            } else if (language === "css") {
              this.appendAsset("style.css", text);
            }
          }
        }
      }
      if (!(hide || this.isMeta())) {
        return this.tokens.push(token);
      }
    };

    return ExampleSection;

  })();

  module.exports = ExampleSection;

}).call(this);
