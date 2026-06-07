---
myst:
  html_meta:
    "description": "Configure block widths for Plate and Plone blocks"
    "property=og:description": "Configure block widths for Plate and Plone blocks"
    "property=og:title": "Configure Plate block widths"
    "keywords": "Plone Aurora, Plate, block width, editor"
---

# Configure editor block widths

This guide explains the current block width model in the Plate editor, including how shared widths are defined, how width policies are configured for Plate blocks and Plone blocks, and how the selected width is injected into rendered block styles.

For the block class-name and data-attribute contract, see {doc}`block-anatomy`.

## How it works

The editor width toolbar and Plate-native width defaults are implemented by `BlockWidthPlugin` in `packages/plate/components/editor/plugins/block-width-plugin.ts`.
Registry-backed Plone block width styles are resolved through the generic style-field runtime, using `blockWidth` as a bridged style field.

The current shape is:

- Widths are stored on block nodes as semantic ids such as `narrow`, `default`, `layout`, and `full`.
- The available width definitions come from `config.blocks.widths`.
- Each width definition is a `StyleDefinition`, so it can inject a full style object.
- The selected width is resolved to a style object and merged into the block element `style` prop.
- The toolbar uses the active block policy to show only the widths allowed for that block.
- Normalization ensures a block always has a valid `blockWidth` value.
- If a block does not define its own `defaultWidth`, the plugin resolves it from `config.blocks.widths`.

The important consequence is that the node stores a width id, not a CSS value.

### Shared width definitions

All available widths are defined in `config.blocks.widths`.

The default definitions are installed in `packages/blocks/index.ts`:

```ts
config.blocks.widths = [
  {
    style: {
      '--block-width': 'var(--narrow-container-width)',
    },
    name: 'narrow',
    label: 'Narrow',
  },
  {
    style: {
      '--block-width': 'var(--default-container-width)',
    },
    name: 'default',
    label: 'Default',
  },
  {
    style: {
      '--block-width': 'var(--layout-container-width)',
    },
    name: 'layout',
    label: 'Layout',
  },
  {
    style: {
      '--block-width': '100%',
    },
    name: 'full',
    label: 'Full Width',
  },
];
```

Each item is a `StyleDefinition`:

- `name`: the value stored in `blockWidth`
- `label`: the label shown in the toolbar
- `style`: the inline style object injected into the rendered block

If the registry contains a width named `default`, it is used as the shared default width.
Otherwise, the first item in `config.blocks.widths` becomes the shared default.

### How styles are injected

The runtime resolves the current `blockWidth` id against `config.blocks.widths`, then injects the matching `style` object into the block element.

That means this width:

```ts
{
  name: 'layout',
  label: 'Layout',
  style: {
    '--block-width': 'var(--layout-container-width)',
  },
}
```

results in an inline CSS custom property on the block element.

The layout CSS consumes that variable in `packages/layout/styles/content-area.css`:

```css
.block .block-inner-container {
  max-width: var(--block-width, var(--default-container-width));
}
```

So the flow is:

1. The node stores `blockWidth: 'layout'`.
2. The runtime resolves `layout` in `config.blocks.widths`.
3. The runtime injects `style={{ '--block-width': 'var(--layout-container-width)' }}`.
4. CSS uses `var(--block-width)` to compute the final `max-width`.

## Configure widths for Plate blocks

Plate-native blocks are configured through `config.blocks.plateBlocksConfig`.

The default setup lives in `packages/blocks/index.ts`:

```ts
config.blocks.plateBlocksConfig = {
  p: {
    blockWidth: {
      defaultWidth: 'narrow',
      widths: ['narrow'],
    },
  },
  title: {
    blockWidth: {
      defaultWidth: 'default',
      widths: ['default'],
    },
  },
  toc: {
    blockWidth: {
      defaultWidth: 'default',
      widths: ['layout', 'default', 'narrow'],
    },
  },
};
```

The key is the Plate element type, for example:

- `p` for paragraphs
- `title` for the title block
- `toc` for the table of contents block

To configure a new Plate block:

```ts
config.blocks.plateBlocksConfig.myBlock = {
  blockWidth: {
    defaultWidth: 'default',
    widths: ['layout', 'default'],
  },
};
```

The `blockWidth` policy supports:

- `defaultWidth`: the width applied when the block has no explicit width
- `widths`: the allowed width ids shown in the toolbar

## Configure widths for Plone blocks

Plone blocks are configured in their block info object under `packages/blocks/<Block>/index.ts`.

Example from `packages/blocks/Image/index.ts`:

```ts
const ImageBlockInfo = {
  id: 'image',
  title: 'Image',
  // ...
  blockWidth: {
    defaultWidth: 'default',
    widths: ['layout', 'default', 'narrow', 'full'],
  },
};
```

This value is registered through `config.blocks.blocksConfig`.
In the current architecture, registry-backed Plone blocks are represented in Plate as `ploneBlock` nodes.
Their `blockWidth` configuration is bridged into the generic style-field runtime, so it is resolved consistently in Plate/Somersault and public `@plone/layout` rendering.

To configure another Plone block, add a `blockWidth` section to its block info object:

```ts
const MyBlockInfo = {
  id: 'myBlock',
  title: 'My block',
  // ...
  blockWidth: {
    defaultWidth: 'default',
    widths: ['default', 'narrow'],
  },
};
```

## Resolution order

Width policy resolution is split by block family:

- For Plate-native blocks, `BlockWidthPlugin` reads `config.blocks.plateBlocksConfig[element.type]`.
- For registry-backed Plone blocks, the style-field runtime reads `config.blocks.blocksConfig[element['@type']].blockWidth`.
- If no Plate-native registry config is found, `BlockWidthPlugin` falls back to plugin options for backward compatibility.

For Plate-native blocks, the width toolbar uses the resolved policy and the shared width definitions together:

- the policy determines which width ids are allowed
- `config.blocks.widths` determines the labels and injected styles for those ids


```{note}
Widths are stored in the node as `blockWidth`.
Width values should be semantic ids such as `narrow` or `layout`, not raw CSS values.
The `BlockWidthPlugin` normalizes Plate-native blocks to ensure `blockWidth` is set and valid for the current block.
The toolbar options are sourced from `config.blocks.widths`.
The actual visual width is controlled by CSS through `--block-width`.
Registry-based configuration is now the preferred approach for both Plate and Plone blocks.
```
