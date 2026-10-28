---
block: maps
---

Embeds an interactive map from a map service.

### Fields

- `url`: the embed URL of the map. For Google Maps, use the URL from *Share > Embed a map*, which starts with `https://www.google.com/maps/embed`.
- `title`: the title of the map, read by screen readers.

### Example

```json
{
  "@type": "maps",
  "url": "https://www.google.com/maps/embed?pb=...",
  "title": "Our office"
}
```
