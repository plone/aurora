---
block: __somersault__
---

A page stores all its content in one block, `__somersault__`, whose `value` is a Plate document: a list of nodes, from top to bottom. The elements and blocks described below are the nodes you can use.

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

There are two kinds of nodes:

- Elements, such as paragraphs, headings or tables, are nodes whose `type` is the element's ID.
- Blocks, such as images or teasers, are nodes of type `ploneBlock`, whose `@type` is the block's ID.

The editor adds `blockWidth` to the nodes, so you can leave it out.

### Inline content

- Formatting is set on text nodes, for example `{ "text": "important", "bold": true }`. The marks are `bold`, `italic`, `underline`, `strikethrough` and `code`.
- A link is an inline element: `{ "type": "a", "url": "/about", "children": [{ "text": "About us" }] }`. Use a path for content from the site.

### Blocks

The data of a block is in its node, next to `@type`, and its `children` is `[{ "text": "" }]`:

```json
{
  "type": "ploneBlock",
  "@type": "teaser",
  "href": [{ "@id": "/news/annual-report-2025" }],
  "children": [{ "text": "" }]
}
```

The examples of each block show only its data. Add `"type": "ploneBlock"` and `children` when you put it in the document.
