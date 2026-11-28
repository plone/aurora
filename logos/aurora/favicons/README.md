# Aurora favicon sets

Two sets, one per logo family. Each folder has the same files:

| File | Size | Drawn from | Use |
|---|---|---|---|
| `favicon.ico` | 16, 32, 48 | 16/32 tuned, 48 full | Legacy browsers, `/favicon.ico` requests |
| `favicon.svg` | vector | 32 tuned | Modern browsers |
| `favicon-16.png`, `favicon-32.png` | 16, 32 | tuned | PNG fallbacks |
| `apple-touch-icon.png` | 180 | full, on night background | iOS home screen (iOS rounds the corners) |
| `icon-192.png`, `icon-512.png` | 192, 512 | full, transparent | Web app manifest |
| `icon-512-maskable.png` | 512 | full, inside the 80% safe zone | Android adaptive icons |
| `site.webmanifest` | | | Web app manifest |

The SVG sources are one folder up: `aurora-<family>.svg` (full mark, 48 px and up),
`aurora-<family>-32.svg` and `aurora-<family>-16.svg` (redrawn on a pixel grid for small sizes).

## HTML

Copy one set to the site root, then:

```html
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#0b0d18">
```
