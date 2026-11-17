---
element: code_block
title: Code block
---

A block of code, shown in a monospace font with syntax highlighting. Each line is a `code_line` element whose children are one text node.

### Fields

- `lang`: the language of the code, for example `js`, `python` or `html`. Optional.

### Example

```json
{
  "type": "code_block",
  "lang": "js",
  "children": [
    { "type": "code_line", "children": [{ "text": "const answer = 42;" }] },
    { "type": "code_line", "children": [{ "text": "console.log(answer);" }] }
  ]
}
```
