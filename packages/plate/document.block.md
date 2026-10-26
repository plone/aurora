---
block: __somersault__
---

A page stores all its content in one block, `__somersault__`, whose `value` is a Plate document: a list of nodes. The blocks described below are nodes of this document too.

Write the document in the `blocks` field of the content, under the `__somersault__` key. `blocks_layout` is not used, and other entries in `blocks` are ignored once the document exists.

```json
{
  "blocks": {
    "__somersault__": {
      "@type": "__somersault__",
      "value": [
        { "type": "title", "children": [{ "text": "Annual report" }] },
        { "type": "p", "children": [{ "text": "Our year in numbers." }] }
      ]
    }
  }
}
```

### Nodes

Every node has `children`. An element's children are other elements or text nodes, `{ "text": "..." }`, and an element without text still needs one empty text node, `[{ "text": "" }]`.

- `title`: the page title, as the first node. It's kept in sync with the `title` field of the content.
- `p`: a paragraph.
- `h2` to `h6`: headings.
- `blockquote`, `code_block`, `hr`, `callout`, `toggle`, `table`, `toc`: quotes, code, separators, callouts, collapsible sections, tables, and a table of contents.
- `column_group` with `column` children: columns.
- A list item is a paragraph with `listStyleType` (`disc` or `decimal`) and `indent` (the nesting level, from `1`).

### Inline content

- Formatting is set on text nodes, for example `{ "text": "important", "bold": true }`. The marks are `bold`, `italic`, `underline`, `strikethrough` and `code`.
- A link is an inline element: `{ "type": "a", "url": "/about", "children": [{ "text": "About us" }] }`. Use a path for content from the site.

### Blocks

A block is a node of type `ploneBlock`. Its `@type` is the block ID, its data is in the node itself, next to `@type`, and its `children` is `[{ "text": "" }]`:

```json
{
  "type": "ploneBlock",
  "@type": "teaser",
  "href": [{ "@id": "/news/annual-report-2025" }],
  "children": [{ "text": "" }]
}
```

The examples of each block show only its data. Add `"type": "ploneBlock"` and `children` when you put it in the document.
