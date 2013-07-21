var escapeJsString, escapeMultilineJsString, parseLineArgs;

exports.escapeJsString = escapeJsString = function(str) {
  return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0').replace(/\//g, "\\/");
};

exports.escapeMultilineJsString = escapeMultilineJsString = function(str) {
  var result, s, strings, _i, _len;
  strings = str.split("\n");
  result = "\"";
  for (_i = 0, _len = strings.length; _i < _len; _i++) {
    s = strings[_i];
    result += "" + (escapeJsString(s)) + "\\n \\\n";
  }
  return result + "\"";
};

exports.parseLineArgs = parseLineArgs = function(s) {
  var match, matches, result, rex, _i, _len;
  if (!s) {
    return s;
  }
  rex = /("([^"]*)"|(\S+))/g;
  matches = s.match(rex);
  result = [];
  for (_i = 0, _len = matches.length; _i < _len; _i++) {
    match = matches[_i];
    if (match[0] === '"') {
      result.push(match.slice(1, -1));
    } else {
      result.push(match);
    }
  }
  return result;
};

exports.parseCodeArgs = function(s, tokens) {
  var first, result;
  result = parseLineArgs(s);
  first = result[0];
  if ((first != null ? first.length : void 0) > 0 && tokens.indexOf(first) < 0) {
    result.unshift("");
  }
  return result;
};

exports.rawToken = function(text) {
  return {
    type: "html",
    pre: true,
    text: text
  };
};

exports.between = function(s, left, right) {
  var endPos, start, startPos;
  startPos = s.indexOf(left);
  endPos = s.indexOf(right);
  start = startPos + left.length;
  if (endPos > startPos) {
    return s.slice(start, endPos);
  } else {
    return "";
  }
};


/*
//@ sourceMappingURL=utils.map
*/