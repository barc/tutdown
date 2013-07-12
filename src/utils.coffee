exports.escapeJsString = escapeJsString = (str) ->
  (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0').replace(/\//g, "\\/")

exports.escapeMultilineJsString  = escapeMultilineJsString = (str) ->
  strings = str.split("\n")
  result = "\""
  for s in strings
    result += """#{escapeJsString(s)}\\n \\\n"""
  result + "\""

# Converts args to an array
#
# Example
#
#   parseLineArgs 'foo "bar fly" baz' => ['foo', 'bar fly', 'baz']
exports.parseLineArgs = parseLineArgs = (s) ->
  return s if not s
  rex = /("([^"]*)"|(\S+))/g
  matches = s.match(rex)
  result = []
  for match in matches
    if match[0] == '"'
      result.push match.slice(1, -1)
    else
      result.push match
  result

# Same as above but first token must be in tokens otherwise, empty
# string is prepended
exports.parseCodeArgs = (s, tokens) ->
  result = parseLineArgs(s)
  first = result[0]
  if first?.length > 0 and tokens.indexOf(first) < 0
    result.unshift ""
  result

# Creates a raw token that is not escaped by marked
exports.rawToken = (text) ->
  type: "html"
  pre: true                       # inserts raw text as side-effect
  text:  text


exports.between = (s, left, right) ->
  startPos = s.indexOf(left)
  endPos = s.indexOf(right)
  start = startPos + left.length
  if endPos > startPos then s.slice(start, endPos) else ""
