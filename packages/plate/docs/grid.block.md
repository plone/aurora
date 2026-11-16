---
element: grid
title: Grid
---

Columns side by side, each with its own blocks. Its children are `grid_column` elements, from 1 to 4 by default. Each column holds its blocks and a width weight.

### Fields

- `id`: on the grid and on each column, a unique ID.
- `headline`: on the grid, an optional heading shown above the columns.
- `theme`: on the grid, its background: `default`, with none, or `grey`.
- `gap`: on the grid, the space between columns: `s`, `m` or `l`.
- `stack`: on the grid, `true` to stack the columns when the grid is narrow.
- `size`: on each column, its width weight, a positive integer. A column with `2` is twice as wide as one with `1`.

A column holds paragraphs and lists, headings, quotes, and the Image, Teaser, Video and Listing blocks. It always holds at least one block. Grids can't be placed inside a grid.

### Example

```json
{
  "type": "grid",
  "id": "opening-hours",
  "headline": "Opening hours",
  "theme": "grey",
  "gap": "m",
  "stack": true,
  "children": [
    {
      "type": "grid_column",
      "id": "visit",
      "size": 2,
      "children": [
        { "type": "h3", "children": [{ "text": "Visit us" }] },
        {
          "type": "p",
          "children": [{ "text": "Open Tuesday to Sunday, 10:00 to 18:00." }]
        }
      ]
    },
    {
      "type": "grid_column",
      "id": "tours",
      "size": 1,
      "children": [
        {
          "type": "p",
          "children": [{ "text": "Guided tours start every hour." }]
        }
      ]
    }
  ]
}
```
