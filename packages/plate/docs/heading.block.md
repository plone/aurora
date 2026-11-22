---
element: h2, h3, h4, h5, h6
title: Heading
document_model: plone.plate
---

A section heading, from `h2` to `h6`. The page title is the `title` element, so don't use a heading for it. Its children are text nodes.

### Example

```json
{ "type": "h2", "children": [{ "text": "Our results" }] }
```
