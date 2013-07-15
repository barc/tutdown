fs = require("fs")
render = require("./render")
async = require("async")
_ = require("underscore")
npath = require("path")
Tutdown = require("./tutdown")

mkdir = (dirname) ->
  if !fs.existsSync(dirname)
    fs.mkdir(dirname)

class DefaultRenderer

  constructor: (@options = {}) ->
    throw new Error('options.assetsDirname is required') unless @options.assetsDirname
    _.defaults @options,
      docStylesheetFile: __dirname + '/../lib/assets/style.css'
      docScriptFile: __dirname + '/../src/assets/tabs.js'

    @docScript = fs.readFileSync(@options.docScriptFile, "utf8")
    @docStylesheet = fs.readFileSync(@options.docStylesheetFile, "utf8")
    @exampleLayout = @options.templates?.example || fs.readFileSync(__dirname + '/../src/templates/example.hbs', 'utf8')

    if @options.docLayoutFile
      @docLayout = fs.readFileSync(@options.docLayoutFile, "utf8")
    else
      @docLayout = "{{{document}}}"

    mkdir @options.assetsDirname

    @umlTemplate = @options.templates?.uml || fs.readFileSync("#{__dirname}/../src/templates/uml.mustache", "utf8")


  # Persist all assets in sections to a directory on the file system.
  persistAssets: (section, cb) ->
    dirname = @options.assetsDirname
    writeAsset = (name, cb) ->
      content = section.assets[name]
      fs.writeFile npath.join(dirname, "#{section.id}-#{name}"), content, cb

    async.forEach _.keys(section.assets), writeAsset, cb


  # Renders a section
  renderSection: (section, cb) =>

    dirname = @options.assetsDirname
    that = @

    @persistAssets section, (err) ->
      return cb(err) if err

      opts =
        templates:
          example: that.exampleLayout
          uml: that.umlTemplate

      render.renderExample section, opts, (err, result) ->
        return cb(err) if err
        exampleRegex = /^{{{EXAMPLE([^}]*)}}}/

        [token, page] = result
        filename = npath.join(dirname, "#{section.id}.html")
        fs.writeFile filename, page, (err) ->
          return cb(err) if err

          # replace {{{EXAMPLE}}} token or append it
          found = _.find section.tokens, (tok) ->
            tok.type != 'code' and tok.text?.match(exampleRegex)

          if found
            _.extend found, token
          else
            section.tokens.push token

          render.renderTokens section.tokens, opts, (err, html) ->
            return cb(err) if err
            section.html = html
            cb()


  toHtml: (result, cb) ->
    {html, script, navLinks} = result
    assetsDirname = @options.assetsDirname

    unless @docStylesheetWritten
      @docStylesheetWritten = true
      stylesheet = npath.join(assetsDirname, 'tutdown.css')
      fs.writeFileSync stylesheet, @docStylesheet

    unless @docScriptWritten
      @docScriptWritten = true
      script = npath.join(assetsDirname, 'tutdown.js')
      fs.writeFileSync script, @docScript

    cb null, html


  _render: (tokens, sections, cb) ->
    self = @
    opts =
      templates:
        uml: @umlTemplate


    # as sections were processed above, {{{sections[id].html}}} placeholders were
    # inserted creating a template
    render.renderTokens tokens, opts, (err, template) ->
      return cb(err) if err

      async.forEach _.values(sections), self.renderSection, (err) ->
        return cb(err) if err

        result =
          html: _.template(template, {sections})
          sections: sections

        self.toHtml result, cb


  # Renders from a string, returning an HTML string
  #
  # @param {Object} options = {
  #   {String} assetPrefix Prefix all assets.
  # }
  render: (markdown, cb) ->
    self = @

    tutdown = new Tutdown(@options)
    tutdown.process markdown, (err, tokens, sections) ->
      return cb(err) if err
      self._render tokens, sections, cb

module.exports = DefaultRenderer
