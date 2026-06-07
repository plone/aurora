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

## Plone Aurora's block model

In the past, the Plone's block engines used different approaches, improving and iterating them over the years.
We identified several of these iterations, and defined what we called the Block Model v3.
It is the model behind Plone Aurora block anatomy contract, and from now on, it is simply referred to as the block model.
Its main goal is to keep view mode and edit mode structurally aligned so the same CSS can work in both places.
Instead of letting each block invent its own wrapper layout, the framework provides a standard two-level structure and leaves the block component focused on content and behavior.

The important ideas are:

- The outer container is responsible for full-width page placement, theme styling, and vertical spacing.
- The inner container controls content width, centering, and block-to-block spacing.
- Block categories drive spacing behavior between adjacent blocks, so spacing decisions stay consistent across the site.
- Blocks should stay simple and render their actual content directly, without adding extra layout wrappers unless they are genuinely needed.
- The model is opt-in, which keeps existing blocks compatible while allowing v3-capable blocks to adopt the shared structure.

In practice, that means the block model defines the structure around a block, while the block itself stays focused on the content it renders.

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
