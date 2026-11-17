---
block: image
---

Shows a single image, either an Image content item from the site or an external image, with optional alt text, link, width, alignment and size.

For an image from the site, set `url` to the path of the Image content item (for example `/my-folder/my-image`), and set `image_field` to `image`. Don't use an `@@images` scale URL.

For an external image, set `url` to the full image URL and leave out `image_field`.

### Fields

- `url`: path or URL of the image.
- `image_field`: the image field of the content item, normally `image`. Only for images from the site.
- `alt`: alternative text for screen readers. Leave it empty for a purely decorative image.
- `href`: optional link target, a list with one item, `[{ "@id": path or URL }]`.
- `openLinkInNewTab`: open the link in a new tab.
- `blockWidth`, `align`, `size`: width, alignment and size on the page.

### Example

```json
{
  "@type": "image",
  "url": "/images/team-photo",
  "image_field": "image",
  "alt": "The team at the 2025 conference",
  "align": "center",
  "size": "l"
}
```
