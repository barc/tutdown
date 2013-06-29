/**
 * Copyright (c) 2013 Mario L Gutierrez
 */
(function() {
  var Funcd, coffee, createHTML, dox, fs, getCaption, getMethodParams, getSections, isClass, isInstanceMethod, isInstanceProperty, isStaticMethod, isTopLevelFunction, _;

  fs = require("fs");

  coffee = require("coffee-script");

  dox = require("dox");

  Funcd = require("funcd");

  _ = require("underscore");

  _.str = require("underscore.string");

  exports.renderFromFile = function(fileName, options, cb) {
    var source;
    if (options == null) {
      options = {};
    }
    if (typeof options === "function") {
      cb = options;
      options = {};
    }
    source = fs.readFileSync(fileName, "utf8");
    if (options.coffeeScript == null) {
      options.coffeeScript = _.str.endsWith(fileName, ".coffee");
    }
    return exports.render(source, options, cb);
  };

  exports.render = function(source, options, cb) {
    var js, json;
    if (options == null) {
      options = {};
    }
    if (typeof options === "function") {
      cb = options;
      options = {};
    }
    js = options.coffeeScript ? coffee.compile(source) : source;
    json = dox.parseComments(js);
    return exports.renderFromDoxJSON(json, options, cb);
  };

  exports.renderFromDoxJSON = function(json, options, cb) {
    var html;
    if (options == null) {
      options = {};
    }
    if (typeof options === "function") {
      cb = options;
      options = {};
    }
    html = Funcd.render(createHTML, {
      json: json,
      options: options
    });
    return typeof cb === "function" ? cb(null, html) : void 0;
  };

  createHTML = function(t, data) {
    var contentFooterTemplate, contentHeaderTemplate, json, navFooterTemplate, navHeaderTemplate, options, sections;
    json = data.json, options = data.options;
    if (options == null) {
      options = {};
    }
    navHeaderTemplate = options.navHeaderTemplate, navFooterTemplate = options.navFooterTemplate, contentHeaderTemplate = options.contentHeaderTemplate, contentFooterTemplate = options.contentFooterTemplate;
    sections = getSections(json);
    t.div({
      id: "nav"
    }, function() {
      var headerItem, headerItemName, section, _i, _len;
      t.div({
        id: "nav-background"
      });
      if (navHeaderTemplate) {
        console.error('NAVHEADER', _.template(navHeaderTemplate, data));
        t.raw(_.template(navHeaderTemplate, data));
      }
      for (_i = 0, _len = sections.length; _i < _len; _i++) {
        section = sections[_i];
        headerItem = _.first(section);
        headerItemName = headerItem.ctx.name;
        t.div({
          "class": "nav-title"
        }, function() {
          return t.a({
            href: "#" + headerItemName
          }, headerItemName);
        });
        t.ul(function() {
          var item, itemName, _j, _len1, _ref, _results;
          _ref = section.slice(1);
          _results = [];
          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
            item = _ref[_j];
            if (item.ctx) {
              itemName = item.ctx.name;
              _results.push(t.li(function() {
                return t.a({
                  href: "#" + headerItemName + "-" + itemName
                }, function() {
                  t.span({
                    "class": "light-text"
                  }, ".");
                  return t.text(item.ctx.name);
                });
              }));
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        });
      }
      if (navFooterTemplate) {
        return t.raw(_.template(navFooterTemplate, data));
      }
    });
    return t.div({
      id: "content"
    }, function() {
      var section, _i, _len;
      if (contentHeaderTemplate) {
        t.raw(_.template(contentHeaderTemplate, data));
      }
      for (_i = 0, _len = sections.length; _i < _len; _i++) {
        section = sections[_i];
        t.section(function() {
          var headerItem, headerItemName, item, itemName, _j, _len1, _ref, _results;
          headerItem = _.first(section);
          headerItemName = headerItem.ctx.name;
          t.h2({
            id: "" + headerItemName
          }, function() {
            t.text(headerItemName);
            return t.span({
              "class": "caption"
            }, getCaption(headerItem, headerItem));
          });
          t.raw(headerItem.description.full);
          _ref = section.slice(1);
          _results = [];
          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
            item = _ref[_j];
            if (item.ctx) {
              itemName = item.ctx.name;
              t.h3({
                id: "" + headerItemName + "-" + itemName
              }, function() {
                t.text(itemName);
                return t.span({
                  "class": "caption"
                }, getCaption(item, headerItem));
              });
            }
            _results.push(t.raw(item.description.full));
          }
          return _results;
        });
      }
      if (contentFooterTemplate) {
        return t.raw(_.template(contentFooterTemplate, data));
      }
    });
  };

  getSections = function(json) {
    var item, sections, _i, _len, _ref;
    sections = [];
    for (_i = 0, _len = json.length; _i < _len; _i++) {
      item = json[_i];
      if (((_ref = item.ctx) != null ? _ref.receiver : void 0) === "Giraffe") {
        sections.push([item]);
      } else {
        _.last(sections).push(item);
      }
    }
    return sections;
  };

  getCaption = function(item, headerItem) {
    var caption, captionTag;
    caption = "";
    captionTag = _.find(item.tags, function(t) {
      return t.type === "caption";
    });
    if (captionTag) {
      return captionTag.string;
    }
    if (isInstanceMethod(item)) {
      caption += "" + (item.ctx.cons.toLowerCase()) + "." + item.ctx.name;
      caption += getMethodParams(item);
    } else if (isClass(item, headerItem)) {
      caption += "new " + item.ctx.string;
      caption += getMethodParams(item);
    } else if (isStaticMethod(item, headerItem)) {
      caption = "" + headerItem.ctx.string + "." + item.ctx.name;
      caption += getMethodParams(item);
    } else if (isTopLevelFunction(item, headerItem)) {
      caption = "" + item.ctx.receiver + "." + item.ctx.name;
      caption += getMethodParams(item);
    } else if (isInstanceProperty(item, headerItem)) {
      caption = "" + (headerItem.ctx.name.toLowerCase()) + "." + item.ctx.name;
    }
    return caption;
  };

  isInstanceMethod = function(item) {
    return item.ctx.type === "method" && item.ctx.cons;
  };

  isClass = function(item, headerItem) {
    return item === headerItem && item.ctx.type === "property" && item.ctx.string === ("" + item.ctx.receiver + "." + item.ctx.name) && item.ctx.name[0] === item.ctx.name[0].toUpperCase();
  };

  isInstanceProperty = function(item, headerItem) {
    return !isClass(item, headerItem) && item.ctx.type === "property";
  };

  isStaticMethod = function(item, headerItem) {
    return item.ctx.type === "method" && item.ctx.receiver === headerItem.ctx.name;
  };

  isTopLevelFunction = function(item, headerItem) {
    return item === headerItem && item.ctx.type === "method" && item.ctx.string === ("" + item.ctx.receiver + "." + item.ctx.name + "()") && item.ctx.name[0] === item.ctx.name[0].toLowerCase();
  };

  getMethodParams = function(item) {
    var paramCount, params, tag, _i, _len, _ref;
    params = "(";
    paramCount = 0;
    _ref = item.tags;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      tag = _ref[_i];
      if (tag.type !== "param") {
        continue;
      }
      if (paramCount > 0) {
        params += ", ";
      }
      paramCount += 1;
      params += tag.name;
    }
    params += ")";
    return params;
  };

}).call(this);