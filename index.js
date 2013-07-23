var DefaultRenderer = require("./lib/defaultRenderer")
var Doxdown = require("./lib/doxdown");
var Path = require("path");
var Fs = require("fs");


function updatePartials(markdown, root) {
  if (markdown.indexOf(':::>') >= 0) {
    markdown = markdown.replace(/:::>(.*)/g, function(found) {
      var file = Path.resolve(Path.join(root, found.substring(4).trim()));
      if (Fs.existsSync(file)) {
        return Fs.readFileSync(file, 'utf8');
      }
      return found;
    });
  }
  return markdown;
}


module.exports = {
  /**
   * Renders markdown to HTML.
   * @param  {String}   markdown The markdown to convert.
   * @param  {Object}   options  = {
   *   {String} assetsDirname       Where to write assets.
   *   {String} docStylesheetFile   Stylesheet file path.
   *   {String} docScriptFile       Script file path.
   *   {String} docLayoutFile       Layout file path.
   *   {String} exampleLayoutFile   Example layout path.
   * }
   * @param  {Function} cb       function(err, html)
   */
  render: function(markdown, options, cb) {
    var renderer = new DefaultRenderer(options);
    markdown = updatePartials(markdown, Path.dirname(options.filename));
    renderer.render(markdown, cb);
  },

  /**
   * Renders javascript/coffee to HTML API docs.
   */
  renderApi: function(source, options, cb) {
    Doxdown.render(source, options, cb);
  }
};
