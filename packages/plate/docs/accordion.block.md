---
element: accordion
title: Accordion
---

A list of panels that open and close. Each panel has a title and its own blocks. Its children are `accordion_panel` elements. Each panel holds an `accordion_panel_title`, with the title text, and an `accordion_panel_content`, with the panel's blocks.

### Fields

- `id`: on the accordion and on each panel, a unique ID.
- `exclusive`: on the accordion, `true` to keep only one panel open at a time in the published view. While editing, panels open and close independently.
- `theme`: on the accordion, its background: `white` or `grey`.
- `startOpen`: on each panel, `true` to show it open when the page loads. With `exclusive`, only the first such panel is open.
- `anchor`: on each panel, a slug, such as `opening-hours`. Links to `#opening-hours` open the panel and scroll to it. Use `""` for none.

A panel holds paragraphs, tables, separators, and the Image, Teaser and Listing blocks. It always holds at least one block. Accordions can't be placed inside an accordion.

### Example

```json
{
  "type": "accordion",
  "id": "visiting-us",
  "exclusive": true,
  "theme": "white",
  "children": [
    {
      "type": "accordion_panel",
      "id": "opening-hours",
      "startOpen": true,
      "anchor": "opening-hours",
      "children": [
        {
          "type": "accordion_panel_title",
          "children": [{ "text": "Opening hours" }]
        },
        {
          "type": "accordion_panel_content",
          "children": [
            {
              "type": "p",
              "children": [{ "text": "Monday to Friday, 9:00 to 17:00." }]
            }
          ]
        }
      ]
    },
    {
      "type": "accordion_panel",
      "id": "how-to-find-us",
      "startOpen": false,
      "anchor": "",
      "children": [
        {
          "type": "accordion_panel_title",
          "children": [{ "text": "How to find us" }]
        },
        {
          "type": "accordion_panel_content",
          "children": [
            {
              "type": "p",
              "children": [{ "text": "Take the tram to Central Square." }]
            }
          ]
        }
      ]
    }
  ]
}
```
