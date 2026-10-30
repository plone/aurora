---
element: column_group
title: Columns
---

Shows content side by side in columns. Its children are `column` elements, and the children of each column are block elements, such as paragraphs, headings or blocks.

### Fields

- `width`: on each `column`, its width as a percentage, for example `"50%"`. The widths of a group add up to `100%`.

### Example

```json
{
  "type": "column_group",
  "children": [
    {
      "type": "column",
      "width": "50%",
      "children": [{ "type": "p", "children": [{ "text": "Left" }] }]
    },
    {
      "type": "column",
      "width": "50%",
      "children": [{ "type": "p", "children": [{ "text": "Right" }] }]
    }
  ]
}
```
