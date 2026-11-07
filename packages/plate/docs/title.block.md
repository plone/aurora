---
element: title
title: Title
document_model: plone.plate
---

The page title. A page has one, as its first node, and it's kept in sync with the `title` field of the content. Its children are text nodes, without formatting.

### Example

```json
{ "type": "title", "children": [{ "text": "Annual report" }] }
```
