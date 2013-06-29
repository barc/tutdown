
:::BEGIN Example

## Tutdown

Tutdown is an extension of Markdown, built upon the excellent [marked](https://github.com/chjj/marked)
project to transform Markdown documents into live, beautiful documentation and examples. Tutdown
has a hint of literate programming.

Tutdown processes sections of a document delimited by

    :::BEGIN Example

    :::END

Tutdown converts these sections into live, editable examples and runs them similarly to
[jsfiddle]() and [plunkr](). The difference is examples live inside your source
repository. Tutdown is a great for [GitHub](https://github.com) pages.

### Table

Language    | Description
------------|------------
JavaScript  | #1 Language on github

### Assets

Describe your tutorial in a sequence that makes sense. Tutdown does not pidgeon hole
you into stuffing code, markup and style into a designated area.
Istead Tutdown captures code snippets in the flow of the document, and creates
assets on the fly for the result example. `js`, `css` and `html` code blocks are
automatically captured unless options are added.

To append code

    ```js
    var extra;
    ```

Explicit CLI-like capture operators may also be used: create (`>`) and append (`>>`).
While this feature exists, it is meant for running
live examples outside the browser such as running node.js examples in a server sandbox
(not yet supported).

    ```js >> code
    var extra;
    ```

To append markup

    ```html
    <div>foo</div>
    ```

To append style

    ```css
    div {
        color: #FF0;
    }
    ```

To render code but not be captured

    ```js --no-capture
    var extra;
    ```

To capture code but not render.  Use the `--hide` option when code is not relevant to understanding
the subject matter but needed by the example to run.

    ```js --hide
    'use strict';
    ```

### Diagrams


Tutdown supports UML diagrams. Diagrams illustrate key ideas which may be difficult to describe with words. Diagrams makes bland document more interesting
and often reinforce the ideas in source code. Tutdown uses the excellent [PlantUML](http://plantuml.sourceforge.net) library.  Java must be installed
to create UML diagrams. There simply isn't anything as good as PlantUML oin the node.js ecosystem. (Yes, I've seen that other project)

For example, this code block

    ```uml "General Sequence"
    User -> Tutdown: create diagram
    User -> Tutdown: add code
    User -> Tutdown: add markup
    User -> Tutdown: add style
    User -> Tutdown: generate
    Tutdown -> Tutdown: convert to HTML
    ```

produces this diagram in simple UTF8 characters


```uml "General Sequence"
User -> Tutdown: create diagram
User -> Tutdown: add code
User -> Tutdown: add markup
User -> Tutdown: add style
User -> Tutdown: generate
Tutdown -> Tutdown: convert to HTML
```

### Example Placeholder

Tutdown appends the live example to the end document by default. To
insert the live example in a different location; simply insert
the following placeholder and Tutdown will replace it with the example
div.

```
{{{EXAMPLE}}}
```


## Example

In this example, we'll use jQuery to set an HTML element's inner HTML then style the
result using simple CSS rules.

### Result

Here's what we are building

{{{EXAMPLE}}}

### Steps

Start with a `div` element and assign an id for efficient lookup.

```html
<div id='main'>
</div>
```

Reference an external jQuery library with a script tag.

```html
<script src="http://ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js"></script>
```

Using JavaScript find the element and assign its `innerHTML` to a
value when the document is ready.

```js
// same as document.ready()
$(function() {
    $('#main').html('Go big or go home!');
});
```

Make it pretty.

```css
#main {
    font-size: 96px;
    font-weight: bold;
    color: #F60;
}
```

:::END

