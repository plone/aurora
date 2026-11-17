---
element: toggle
title: Toggle
---

A collapsible section. The toggle node holds only its heading text. Its content is the nodes that follow it with a higher `indent` than the toggle: set `indent` to `1` on each of them, or one more than the toggle's own `indent`.

### Example

```json
{ "type": "toggle", "children": [{ "text": "How do I apply?" }] }
```

```json
{ "type": "p", "indent": 1, "children": [{ "text": "Fill in the form on the application page." }] }
```
