var DefaultRenderer = require("./lib/defaultRenderer")
var Doxdown = require("./lib/doxdown");

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
    renderer.render(markdown, cb);
  },

  /**
   * Renders javascript/coffee to HTML API docs.
   */
  renderApi: function(source, options, cb) {
    Doxdown.render(source, options, cb);
  }
};
