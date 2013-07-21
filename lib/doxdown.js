var Funcd, codeFilter, coffee, createContent, createNav, dox, fixCoffeeComments, fs, getCaption, getMethodParams, getSections, isClass, isInstanceMethod, isInstanceProperty, isStatic, isStaticMethod, isTopLevelFunction, reformatDoxDescription, utils, _;

fs = require("fs");

coffee = require("coffee-script");

dox = require("dox");

Funcd = require("funcd");

_ = require("underscore");

_.str = require("underscore.string");

utils = require("./utils");

codeFilter = require("./codeFilter");

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
  if (options.coffeeScript) {
    js = coffee.compile(source);
    if (options.commentFiller != null) {
      js = fixCoffeeComments(js, options.commentFiller);
    }
  } else {
    js = source;
  }
  json = dox.parseComments(js);
  if (options.debug) {
    fs.writeFileSync("dox.json", JSON.stringify(json, null, 2));
  }
  return exports.renderFromDoxJSON(json, options, cb);
};

exports.renderFromDoxJSON = function(json, options, cb) {
  var content, nav;
  if (options == null) {
    options = {};
  }
  if (typeof options === "function") {
    cb = options;
    options = {};
  }
  content = Funcd.render(createContent, {
    json: json,
    options: options
  });
  nav = Funcd.render(createNav, {
    json: json,
    options: options
  });
  return typeof cb === "function" ? cb(null, {
    content: content,
    nav: nav
  }) : void 0;
};

fixCoffeeComments = function(source, commentFiller) {
  var L, line, result, startIndex, _i, _len, _ref;
  result = [];
  L = commentFiller.length;
  startIndex = -1;
  _ref = _.str.lines(source);
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    line = _ref[_i];
    if (line.match(/^\s+\/\*/)) {
      startIndex = line.indexOf('/*');
      result.push(line);
      continue;
    }
    if (line.match(/^\s+\*\//)) {
      result.push(line);
      startIndex = -1;
      continue;
    }
    if (startIndex > -1) {
      if (line.substring(startIndex, startIndex + 2) === commentFiller) {
        result.push(line.slice(0, startIndex) + '* ' + line.slice(startIndex + 2));
      } else {
        result.push(line);
      }
    } else {
      result.push(line);
    }
  }
  return result.join("\n");
};

isStatic = function(str) {
  return str.indexOf('.prototype.') < 0 && str.indexOf('this.') < 0;
};

createNav = function(t, data) {
  var headerItem, headerItemName, json, navFooterTemplate, navHeaderTemplate, options, section, sections, _i, _len;
  json = data.json, options = data.options;
  if (options == null) {
    options = {};
  }
  navHeaderTemplate = options.navHeaderTemplate, navFooterTemplate = options.navFooterTemplate;
  sections = getSections(json);
  for (_i = 0, _len = sections.length; _i < _len; _i++) {
    section = sections[_i];
    headerItem = _.first(section);
    headerItemName = headerItem.ctx.name;
    t.h2(function() {
      return t.a({
        href: "#" + headerItemName
      }, headerItemName);
    });
    t.ul({
      "class": "methods"
    }, function() {
      var isClassMethod, item, itemName, _j, _len1, _ref, _results;
      _ref = section.slice(1);
      _results = [];
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        item = _ref[_j];
        if (item.ctx) {
          isClassMethod = isStatic(item.ctx.string);
          itemName = item.ctx.name;
          _results.push(t.li(function() {
            var attrs;
            attrs = {
              href: "#" + headerItemName + "-" + item.ctx.name
            };
            if (isClassMethod) {
              attrs["class"] = "static";
            }
            return t.a(attrs, itemName);
          }));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    });
  }
  return null;
};

reformatDoxDescription = function(body) {
  var regex;
  regex = /(<pre><code>(.|\n)*?)<\/code><\/pre>/gm;
  body = body.replace(regex, function(found, pos) {
    var code;
    code = utils.between(found, '<pre><code>', '</code></pre>');
    code = _.str.unescapeHTML(code);
    code = codeFilter(code, {
      language: 'js'
    });
    return "<pre><code>" + code + "</code></pre>";
  });
  return body = body.replace(/<br \/>/g, ' ');
};

createContent = function(t, data) {
  var contentFooterTemplate, contentHeaderTemplate, json, options, section, sections, _i, _len;
  json = data.json, options = data.options;
  if (options == null) {
    options = {};
  }
  contentHeaderTemplate = options.contentHeaderTemplate, contentFooterTemplate = options.contentFooterTemplate;
  sections = getSections(json);
  for (_i = 0, _len = sections.length; _i < _len; _i++) {
    section = sections[_i];
    t.section(function() {
      var attrs, headerItem, headerItemName, isClassMethod, item, itemName, _j, _len1, _ref, _results;
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
      t.raw(reformatDoxDescription(headerItem.description.full));
      _ref = section.slice(1);
      _results = [];
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        item = _ref[_j];
        if (item.ctx) {
          isClassMethod = isStatic(item.ctx.string);
          itemName = item.ctx.name;
          attrs = {
            id: "" + headerItemName + "-" + itemName
          };
          if (isClassMethod) {
            attrs["class"] = "static";
          }
          t.h3(attrs, function() {
            t.text(itemName);
            return t.span({
              "class": "caption"
            }, getCaption(item, headerItem));
          });
        }
        _results.push(t.raw(reformatDoxDescription(item.description.full)));
      }
      return _results;
    });
  }
  return null;
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


/*
//@ sourceMappingURL=doxdown.map
*/