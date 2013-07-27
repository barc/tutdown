var Tutdown, async, fs, handlebars, hjs, marked, npath, render, sectionHandlers, str, utils, _;

marked = require("marked");

hjs = require("highlight.js");

async = require("async");

_ = require("underscore");

utils = require("./utils");

fs = require("fs");

handlebars = require("handlebars");

npath = require("path");

render = require("./render");

str = require("underscore.string");

_.templateSettings = {
  interpolate: /{{{(.+?)}}}/g,
  escape: /{{([^{]+?)}}/g
};

sectionHandlers = {
  Example: require("./sectionHandlers/exampleSection")
};

Tutdown = (function() {
  function Tutdown(options) {
    this.options = options != null ? options : {};
    if (!this.options.assetPrefix) {
      throw new Error('options.assetPrefix is REQUIRED');
    }
    this.examples = {};
    this.docScript = "";
    this.navLinks = [];
  }

  Tutdown.prototype.processSections = function(tokens, cb) {
    var beginSection, closeDiv, endSection, exampleCounter, processToken, section, sections, tokenStack,
      _this = this;
    beginSection = /^:{3,}BEGIN\s+(\w.+)\s*$/;
    endSection = /^:{3,}END/;
    tokenStack = [];
    section = null;
    sections = {};
    exampleCounter = 0;
    closeDiv = false;
    processToken = function(token, cb) {
      var id, klass, lang, matches, text, type;
      type = token.type, text = token.text, lang = token.lang;
      if (type === "heading") {
        token._attributes = "id='h-" + (str.slugify(token.text)) + "'";
      }
      if (type === "paragraph" && (matches = text.match(beginSection))) {
        klass = matches[1];
        id = _this.options.assetPrefix + exampleCounter;
        exampleCounter += 1;
        if (sectionHandlers[klass]) {
          section = sectionHandlers[klass].begin(id, token);
        } else {
          token = utils.rawToken("<div class='" + klass + "'>");
          if (section) {
            section.push(token);
          } else {
            tokenStack.push(token);
          }
          closeDiv = true;
        }
        return cb();
      } else if (type === "paragraph" && (matches = text.match(endSection))) {
        if (closeDiv) {
          token = utils.rawToken('</div>');
          if (section) {
            section.push(token);
          } else {
            tokenStack.push(token);
          }
          closeDiv = false;
          return cb();
        } else {
          return section.end(token, function(err) {
            if (err) {
              return cb(err);
            }
            sections[section.id] = section;
            tokenStack.push({
              text: "{{{sections['" + section.id + "'].html}}}",
              type: "html",
              pre: true
            });
            section = null;
            return cb();
          });
        }
      } else if (section) {
        section.push(token);
        return cb();
      } else {
        tokenStack.push(token);
        return cb();
      }
    };
    return async.forEachSeries(tokens, processToken, function(err) {
      if (err) {
        return cb(err);
      }
      tokenStack.links = tokens.links;
      tokenStack;
      return cb(null, tokenStack, sections);
    });
  };

  Tutdown.prototype.process = function(source, options, cb) {
    var defaults, self, tokens;
    if (typeof options === "function") {
      cb = options;
      options = {};
    }
    defaults = {
      gfm: true,
      tables: true,
      breaks: false,
      pedantic: false,
      sanitize: false,
      smartLists: true,
      langPrefix: ""
    };
    options = _.defaults(options, defaults);
    self = this;
    tokens = marked.Lexer.lex(source, options);
    return this.processSections(tokens, cb);
  };

  return Tutdown;

})();

module.exports = Tutdown;


/*
//@ sourceMappingURL=tutdown.map
*/