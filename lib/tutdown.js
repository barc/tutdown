/**
 * Copyright (c) 2013 Mario L Gutierrez
 */
(function() {
  var Tutdown, async, codeFilter, fs, handlebars, hjs, marked, npath, render, sectionHandlers, utils, _;

  marked = require("marked");

  hjs = require("highlight.js");

  codeFilter = require("./codeFilter");

  async = require("async");

  _ = require("underscore");

  utils = require("./utils");

  fs = require("fs");

  handlebars = require("handlebars");

  npath = require("path");

  render = require("./render");

  _.templateSettings = {
    interpolate: /{{{(.+?)}}}/g,
    escape: /{{([^{]+?)}}/g
  };

  sectionHandlers = {
    Example: require("./sectionHandlers/exampleSection")
  };

  Tutdown = (function() {
    function Tutdown() {
      this.examples = {};
      this.docScript = "";
      this.navLinks = [];
    }

    Tutdown.prototype.processSections = function(tokens, cb) {
      var beginSection, endSection, processToken, section, sections, tokenStack,
        _this = this;
      beginSection = /^:{3,}BEGIN\s+(\w.+)\s*$/;
      endSection = /^:{3,}END\s*$/;
      tokenStack = [];
      section = null;
      sections = {};
      processToken = function(token, cb) {
        var klass, lang, matches, text, type;
        type = token.type, text = token.text, lang = token.lang;
        if (type === "paragraph" && (matches = text.match(beginSection))) {
          klass = matches[1];
          section = sectionHandlers[klass].begin(token);
          return cb();
        } else if (type === "paragraph" && (matches = text.match(endSection))) {
          return section.end(token, function(err) {
            if (err) {
              return cb(err);
            }
            sections[section.id] = section;
            tokenStack.push({
              text: "{{{sections." + section.id + ".html}}}",
              type: "text",
              escaped: true
            });
            section = null;
            return cb();
          });
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
        sanitize: true,
        smartLists: true,
        langPrefix: "language-"
      };
      options = _.defaults(options, defaults);
      self = this;
      tokens = marked.Lexer.lex(source, options);
      return this.processSections(tokens, cb);
    };

    return Tutdown;

  })();

  module.exports = Tutdown;

}).call(this);
