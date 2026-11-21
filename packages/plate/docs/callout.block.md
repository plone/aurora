---
element: callout
title: Callout
document_model: plone.plate
---

A highlighted box with an icon, to draw attention to a note, a tip or a warning. Its children are text nodes and inline elements.

### Fields

- `icon`: an emoji shown at the start, for example `💡` or `⚠️`.

### Example

```json
{
  "type": "callout",
  "icon": "💡",
  "children": [{ "text": "Registration closes on Friday." }]
}
```
