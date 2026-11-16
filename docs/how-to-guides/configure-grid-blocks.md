---
myst:
  html_meta:
    "description": "Configure the grid block of Plone Aurora, and use it in editors outside Aurora"
    "property=og:description": "Configure the grid block of Plone Aurora, and use it in editors outside Aurora"
    "property=og:title": "Configure grid blocks"
    "keywords": "Plone Aurora, Plate, grid, columns, block, layout, add-on, Volto"
---

# Configure grid blocks

This guide shows how to configure the grid block, columns side by side, each with its own blocks and a width weight.
It also shows how a block adapts to the column it sits in, and what an editor outside Aurora, such as one in Volto, needs to use the grid.

The grid is a Plate.js block of `@plone/plate`, in the editor and renderer kits that every Plate preset uses.
Its data is described in the grid's block documentation, {file}`packages/plate/docs/grid.block.md`.

## Editing

Editors insert a grid from the slash menu, under "Advanced blocks", or turn selected blocks into one.
A new grid has two equal columns, with the caret in the first one, and its settings open.

- Each column holds blocks, as a small document: {kbd}`Enter` adds a block, and {kbd}`/` offers the blocks a column can hold.
- A handle at the top of a column moves, duplicates, and deletes it, and its grip drags it to another position.
  {kbd}`Alt+Shift+←` and {kbd}`Alt+Shift+→` move the column that holds the caret.
- A {guilabel}`+` in the gaps between columns, and at the outer edges, inserts a column there.
- {kbd}`Esc` selects the level above: a block, its column, the grid, then the page.
- The grid's settings set the column count, the layout, the background, the headline, the gap, and whether the columns stack on narrow widths.

## Options

The grid plugin takes these options.

`maxColumns`
:   The most columns a grid can have.
    The default is `4`.

`layouts`
:   The layouts offered for each column count, as lists of column weights.
    A column with weight `2` is twice as wide as one with weight `1`.
    The defaults are `1:1`, `2:1`, and `1:2` for 2 columns, `1:1:1`, `2:1:1`, `1:2:1`, and `1:1:2` for 3 columns, and equal columns for 4.

`allowedBlocks`
:   The blocks a column can hold: Plate.js element types, such as `p` or `h2`, and the `@type` of Plone blocks, such as `image`.
    The default is text, headings, lists, quotes, and the Image, Teaser, Video, and Listing blocks.
    Lists are paragraphs, so `p` allows them too.
    A Plone block is only offered when the editor has the Plone block adapter and the block is registered.
    Grids are never allowed inside a grid.

`themes`
:   The backgrounds editors can choose from, as style definitions, the same shape as `config.blocks.themes`: `{ name, label, style }`, where `style` holds custom properties such as `--theme-color` and `--theme-foreground-color`.
    The first one is the default.
    The defaults are Default, with no background, and Grey.

`blocksConfig`
:   Rules for the blocks inside a grid, by block type.
    Each entry has a `schemaEnhancer`, `(schema, { blockType, container, t }) => schema`, that adapts the block's settings inside a grid.
    An entry replaces the default rule of its block type, and the other defaults stay.
    By default, images don't offer size or alignment, since the column sets their width, and teasers don't offer a background, since the grid's applies.

Set them from an add-on in both {file}`config/plate-editor.ts` and {file}`config/plate-renderer.ts`, since the published view uses the themes too.
See {doc}`add-plate-plugins` for how these modules are loaded.
Reconfigure the plugin that's already in the list, so it keeps its component.

```ts
// my-addon/config/grid-options.ts
export const gridOptions = {
  maxColumns: 3,
  layouts: {
    2: [
      [1, 1],
      [3, 1],
      [1, 3],
    ],
  },
  themes: [
    { name: 'default', label: 'Default', style: {} },
    {
      name: 'sand',
      label: 'Sand',
      style: { '--theme-color': '#f3ead8', '--theme-foreground-color': '#2b2111' },
    },
  ],
};
```

```ts
// my-addon/config/plate-editor.ts
import type { PlateEditorExtension } from '@plone/plate/extensions';
import { gridOptions } from './grid-options';

const extension: PlateEditorExtension = {
  plugins: (plugins) =>
    plugins.map((plugin) =>
      plugin.key === 'grid' ? plugin.configure({ options: gridOptions }) : plugin,
    ),
};

export default extension;
```

Do the same in {file}`config/plate-renderer.ts`.

To change the rules for an add-on block, add an entry for it:

```ts
import { withoutFields } from '@plone/plate/components/editor/plugins/containers';

export const gridOptions = {
  blocksConfig: {
    mainslider: {
      schemaEnhancer: (schema) =>
        withoutFields(schema, ['autoplay'], "Sliders inside a grid don't play on their own."),
    },
  },
};
```

## Backgrounds and block themes

The background is a style field, `theme`, so the grid stores a name, such as `grey`, and never a color.
The grid's `themes` option provides the definitions.
They render as custom properties and `data-style-theme` on the grid, like the style fields of other blocks.
See {doc}`configure-style-fields`.

A site that defines its own block themes can offer them in the grid by passing the same list as the grid's `themes`.
Saved grids keep working, since they only store the theme's name.

## Adapt a block to its column

A block inside a grid can read where it sits with `useBlockContainer()`, from `@plone/helpers`, in the editor and in the published view.
It returns `null` outside a container.
In a grid column, it returns the grid's data, the column's position and count, its weight, and the grid's total weight.

```tsx
import { getBlockContainerShare, useBlockContainer } from '@plone/helpers';

const MyBlockView = (props) => {
  const container = useBlockContainer();
  // For example 0.5 in the first column of a 1:1 grid.
  const share = getBlockContainerShare(container);
  // …
};
```

The Image and Teaser blocks use it to set the image's `sizes` from the column's share of the width, so browsers load a file that fits the column.

## Style the grid

See the grid in {doc}`style-blocks-in-a-theme`.

## Use the grid outside Aurora

The grid depends only on Plate.js and `@plone/plate`.
An editor outside Aurora, such as one in Volto, gets it from the `block-editor` and `block-renderer` presets of `@plone/plate`.

Translations
:   Pass `PlateEditor` a `t` function and the `language`, or the legacy `intl` object.
    Untranslated strings fall back to English.

Styles
:   Load {file}`@plone/plate/styles/content.css` for the published view and the blocks in the editor.

Settings
:   The settings of the grid open in a popover from the column handle.
    A host with a settings sidebar passes `settingsContainer`, a function that returns the sidebar's element, to `PlateEditor`, and the settings render there instead.

Drag and drop
:   The grid's kit renders a `DndProvider` from `react-dnd`, for the column grips.
    In an editor that already has `@plone/plate`'s `DndKit`, the two share one provider.

Plone blocks
:   Image, Teaser, Video, and Listing blocks in columns need the Plone block adapter, which Aurora's `somersault` presets include.
    Without it, columns hold text blocks only.
