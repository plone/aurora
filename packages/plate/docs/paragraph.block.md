---
element: p
title: Paragraph
---

A paragraph of text, the most common node of a page. Its children are text nodes and inline elements, such as links.

A paragraph is also a list item when it has `listStyleType` and `indent`:

- `listStyleType`: `disc` for a bulleted list, `decimal` for a numbered list, or `todo` for a checklist, with `checked` set to `true` or `false`.
- `indent`: the nesting level, from `1`.
- `listStart`: the first number of a numbered list, on its first item.

Consecutive list items with the same `listStyleType` and `indent` form one list.

### Example

```json
{
  "type": "p",
  "children": [
    { "text": "Read the " },
    { "type": "a", "url": "/about", "children": [{ "text": "about page" }] },
    { "text": " to learn more." }
  ]
}
```

```json
{ "type": "p", "listStyleType": "disc", "indent": 1, "children": [{ "text": "First item" }] }
```
