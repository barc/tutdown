var ExampleSection, Path, async, beginAssetSubTemplate, beginSectionTemplate, endAssetSubTemplate, endSectionTemplate, str, utils, _;

utils = require("../utils");

_ = require('underscore');

str = require("underscore.string");

async = require("async");

Path = require("path");

beginSectionTemplate = "<div class='section-example'>";

endSectionTemplate = "</div>";

beginAssetSubTemplate = "<div id=\"{{{id}}}-{{{name}}}tab\" class=\"tab_content\">";

endAssetSubTemplate = "</div>";

ExampleSection = (function() {
  function ExampleSection(id, token) {
    this.id = id;
    this.tokens = [];
    this.tokens.push(utils.rawToken(_.template(beginSectionTemplate, {
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
    return utils.rawToken(_.template(beginAssetSubTemplate, {
      id: this.id,
      name: name
    }));
  };

  ExampleSection.prototype.closeAsset = function() {
    if (this.currentAsset && !this.isMeta()) {
      this.tokens.push(utils.rawToken("</div>"));
      return this.currentAsset = null;
    }
  };

  ExampleSection.prototype.end = function(token, cb) {
    var that;
    this.closeAsset();
    that = this;
    token = utils.rawToken("</div>");
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
    var args, depth, extname, filename, hide, lang, language, noCapture, parts, text, type;
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
    if (type === "paragraph" && text.indexOf(':::@') === 0) {
      this.nextArgs = text.slice(4).trim().split(/\s+/);
      return;
    }
    if (type === "code") {
      parts = lang.split(/\s+/);
      language = parts[0];
      extname = Path.extname(language);
      if (extname.length > 0) {
        token.lang = language = extname.slice(1);
      }
      args = this.nextArgs || parts.slice(1) || [];
      noCapture = args.indexOf('--no-capture') > -1;
      hide = args.indexOf('--hide') > -1;
      this.nextArgs = null;
      if (!noCapture) {
        switch (language) {
          case "js":
          case "javascript":
            filename = "script.js";
            break;
          case "css":
            filename = "style.css";
            break;
          case "html":
            filename = "markup.html";
        }
        if (filename) {
          this.appendAsset(filename, text);
        }
      }
    }
    if (!hide) {
      return this.tokens.push(token);
    }
  };

  return ExampleSection;

})();

module.exports = ExampleSection;


/*
//@ sourceMappingURL=exampleSection.map
*/