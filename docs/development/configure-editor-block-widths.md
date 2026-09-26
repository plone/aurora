---
myst:
  html_meta:
    "description": "Configure block widths for Plate and Plone blocks"
    "property=og:description": "Configure block widths for Plate and Plone blocks"
    "property=og:title": "Configure editor block widths"
    "keywords": "Plone Aurora, Plate, block width, editor"
---

# Configure editor block widths

This guide explains the current block width model in the Plate editor, including how shared widths are defined, how width policies are configured for Plate-native blocks and `ploneBlock` nodes, and how the selected width is injected into rendered block styles.

For the block class-name and data-attribute contract, see {doc}`block-anatomy`.

## How it works

The editor width toolbar and Plate-native width defaults are implemented by `BlockWidthPlugin` in `packages/plate/components/editor/plugins/block-width-plugin.ts`.
Registry-backed Plone block width styles are resolved through the generic style-field runtime, using `blockWidth` as a bridged style field.

The current model is:

- Widths are stored on block nodes as semantic ids such as `narrow`, `default`, `layout`, and `full`.
- The available width definitions come from `config.blocks.widths`.
- Each width definition is a `StyleDefinition`, so it can inject a full style object.
- The selected width is resolved to a style object and merged into the block element `style` prop.
- The toolbar uses the active Plate-native block policy to show only the widths allowed for that block.
- Registry-backed Plone blocks expose width controls through their schema-driven block settings form when their schema declares `blockWidth`.
- Normalization ensures Plate-native blocks and `ploneBlock` nodes get a valid `blockWidth` value.
- If a Plate-native block does not define its own `defaultWidth`, the plugin resolves it from `config.blocks.widths`.
- If a `ploneBlock` does not declare a `blockWidth` style field in its schema, `StyleFieldsPlugin` uses `defaultBlockWidth` from the Plone block config, then falls back to `default`.

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

Plate-native blocks use the width named `default` as the shared default width.
If no `default` width exists, Plate-native blocks use the first item in `config.blocks.widths`.
For `ploneBlock` nodes, the built-in fallback ID is `default`.
Keep a `default` entry in `config.blocks.widths` unless every `ploneBlock` has a schema default or `defaultBlockWidth`.

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

## Configure widths for Plone blocks with editor controls

Plone blocks (non-plate native, registry-backed) expose editor width controls through their block schema.
They are stored as `ploneBlock` nodes in the Somersault value.

Example from `packages/blocks/Image/schema.tsx`:

```ts
blockWidth: {
  title: 'Block width',
  widget: 'width',
  default: 'default',
  styleField: true,
},
```

This stores the selected width id in the block data as `blockWidth`.
Because the field is marked with `styleField: true`, `StyleFieldsPlugin` can resolve that stored id to the matching style definition from `config.blocks.widths`.
The field appears in the block settings form, not in the Plate-native width toolbar.

To configure another Plone block, add a `blockWidth` property to its schema:

```ts
properties: {
  blockWidth: {
    title: 'Block width',
    widget: 'width',
    default: 'default',
    actions: ['narrow', 'default'],
    styleField: true,
  },
}
```

## Configure the default width for Plone blocks without editor controls

Some Plone blocks should get a default width without exposing a width field in their schema.
For those blocks, set `defaultBlockWidth` in `config.blocks.blocksConfig`.

```ts
config.blocks.blocksConfig.teaser = {
  id: 'teaser',
  title: 'Teaser',
  defaultBlockWidth: 'layout',
  blockSchema: TeaserSchema,
};
```

`defaultBlockWidth` only provides the fallback value.
It does not add a field to the block settings form.

If a block has neither a schema-declared `blockWidth` style field nor `defaultBlockWidth`, `StyleFieldsPlugin` uses `default`.

## Resolution order

Width policy resolution is split by block family:

- For Plate-native blocks, `BlockWidthPlugin` reads `config.blocks.plateBlocksConfig[element.type]`.
- For Plone blocks, `StyleFieldsPlugin` reads fields marked with `styleField` from `config.blocks.blocksConfig[element['@type']].blockSchema`.
- For Plone blocks without a schema-declared `blockWidth`, `StyleFieldsPlugin` reads `config.blocks.blocksConfig[element['@type']].defaultBlockWidth`.
- If no Plone block default is configured, `StyleFieldsPlugin` falls back to `default`.
- If no Plate-native registry config is found, `BlockWidthPlugin` falls back to plugin options for backward compatibility.

For Plate-native blocks, the width toolbar uses the resolved policy and the shared width definitions together:

- the policy determines which width ids are allowed
- `config.blocks.widths` determines the labels and injected styles for those ids

For `ploneBlock` nodes, the block settings form writes `blockWidth` when the schema declares the field.
`StyleFieldsPlugin` then resolves that stored value, `defaultBlockWidth`, or `default` through the same shared width definitions.

```{note}
Widths are stored in the node as `blockWidth`.
Width values should be semantic ids such as `narrow` or `layout`, not raw CSS values.
The `BlockWidthPlugin` normalizes Plate-native blocks to ensure `blockWidth` is set and valid for the current block.
The `StyleFieldsPlugin` normalizes `ploneBlock` nodes to ensure baseline `blockWidth` data is present.
The Plate-native toolbar options are sourced from `config.blocks.widths`.
The actual visual width is controlled by CSS through `--block-width`.
Schema style fields are preferred when a Plone block exposes width controls.
Use `defaultBlockWidth` only when a Plone block needs a default width without editor controls.
```
