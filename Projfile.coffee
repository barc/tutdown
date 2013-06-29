exports.project = (pm) ->
  {f, $} = pm

  toLib =
    _filename: { replace: [/^src/, "lib"] }

  addHeader = f.addHeader text:"""
  /**
   * Copyright (c) 2013 Mario L Gutierrez
   */

  """

  scripts:
    files: "src/**/*.coffee"
    dev: [
      f.coffee
      addHeader
      f.writeFile toLib
    ]

  styles:
    files: "src/assets/style.less"
    dev: [
      f.less
      f.writeFile toLib
    ]

  example:
    deps: ["scripts", "styles"]
    dev: (cb) ->
      this.timeout = 4000
      $.node "bin/tutdown -o example.html -l src/templates/html.hbs example/example.md", cb
