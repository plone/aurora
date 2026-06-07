---
myst:
  html_meta:
    "description": "Block anatomy contract for Plone Aurora"
    "property=og:description": "Block anatomy contract for Plone Aurora"
    "property=og:title": "Block anatomy"
    "keywords": "Plone Aurora, blocks, Plate, block model, anatomy"
---

# Block anatomy

Plone Aurora exposes a shared block anatomy contract for both public rendering and Plate/Somersault rendering.

The outer block element receives:

```html
class="block block-<type> category-<category>"
data-block-type="<type>"
data-block-category="<category>"
```

For example, a teaser block in the teaser category renders as:

```html
<div
  class="block block-teaser category-teaser"
  data-block-type="teaser"
  data-block-category="teaser"
>
  <div class="block-inner-container">...</div>
</div>
```

## Where the contract is applied

The anatomy contract is resolved by `resolveBlockAnatomy` in `@plone/helpers`.

It is consumed by:

- `BlockWrapper` in `@plone/layout` for Plone Volto block rendering
- `BlockAnatomyPlugin` in `@plone/plate` for Plate-native and Somersault editor block rendering

This avoids duplicating class-name rules in individual blocks.

Plone Volto block rendering and Somersault editor rendering are separate paths.
Plone Volto rendering uses `BlockWrapper`.
Somersault editor rendering goes through Plate and receives the same classes from `BlockAnatomyPlugin`.

## Plate-native block categories

Plate-native block categories are configured in `config.blocks.plateBlocksConfig`.

```ts
config.blocks.plateBlocksConfig = {
  p: {
    category: 'text',
    blockWidth: {
      defaultWidth: 'narrow',
      widths: ['narrow'],
    },
  },
  toc: {
    category: 'navigation',
    blockWidth: {
      defaultWidth: 'default',
      widths: ['layout', 'default', 'narrow'],
    },
  },
};
```

Registry-backed Plone blocks use the `category` from `config.blocks.blocksConfig`.

## Registry-backed Plone blocks in Plate

Registry-backed Plone blocks embedded in Plate use the `ploneBlock` node type.
The underlying Plone block type is stored in `@type`.

```ts
{
  type: 'ploneBlock',
  '@type': 'image',
  children: [{ text: '' }],
}
```

`BlockAnatomyPlugin` resolves this as block type `image`, not `ploneBlock`.

## Style fields are separate

Block anatomy controls DOM classes and data attributes.
Style fields control CSS custom properties.

For example:

- `BlockAnatomyPlugin` adds `.block.block-teaser.category-teaser`
- `StyleFieldsPlugin` adds styles such as `--theme-color` or `--block-width`

Keep these responsibilities separate when adding new styling behavior.
