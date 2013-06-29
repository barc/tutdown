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

