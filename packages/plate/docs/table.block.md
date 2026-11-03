---
element: table
title: Table
---

A table. Its children are rows (`tr`), whose children are cells: `th` for header cells and `td` for the others. The children of a cell are block elements, usually paragraphs.

Every row has the same number of cells.

### Fields

- `colSizes`: optional widths of the columns, in pixels, for example `[200, 100]`.

### Example

```json
{
  "type": "table",
  "children": [
    {
      "type": "tr",
      "children": [
        { "type": "th", "children": [{ "type": "p", "children": [{ "text": "Year" }] }] },
        { "type": "th", "children": [{ "type": "p", "children": [{ "text": "Visitors" }] }] }
      ]
    },
    {
      "type": "tr",
      "children": [
        { "type": "td", "children": [{ "type": "p", "children": [{ "text": "2025" }] }] },
        { "type": "td", "children": [{ "type": "p", "children": [{ "text": "12,000" }] }] }
      ]
    }
  ]
}
```
