---
myst:
  html_meta:
    "description": "Configure the accordion block of Plone Aurora, and use it in editors outside Aurora"
    "property=og:description": "Configure the accordion block of Plone Aurora, and use it in editors outside Aurora"
    "property=og:title": "Configure accordion blocks"
    "keywords": "Plone Aurora, Plate, accordion, block, panels, add-on, Volto"
---

# Configure accordion blocks

This guide shows how to configure the accordion block, a list of panels that open and close, each with a title and its own blocks.
It also shows what an editor outside Aurora, such as one in Volto, needs to use it.

The accordion is a Plate.js block of `@plone/plate`, in the editor and renderer kits that every Plate preset uses.
Its data is described in the accordion's block documentation, {file}`packages/plate/docs/accordion.block.md`.

## Options

The accordion plugin takes these options.

`allowedBlocks`
:   The blocks a panel can hold: Plate.js element types, such as `p`, `table`, or `hr`, and the `@type` of Plone blocks, such as `image`.
    The default is `['p', 'table', 'hr', 'image', 'teaser', 'listing']`.
    Lists are paragraphs, so `p` allows them too.
    A Plone block is only offered when the editor has the Plone block adapter and the block is registered.
    Accordions are never allowed inside an accordion.

`themes`
:   The backgrounds editors can choose from, as `{ id, label, color }` objects.
    The first one is the default.
    The defaults are White, `#ffffff`, and Grey, `#ecebeb`.

`headingLevel`
:   The heading level of the panel titles in the published view, from `2` to `6`.
    The default is `3`.

`innerBlockSchemaEnhancer`
:   A function that adapts the settings schema of the blocks inside an accordion, `(schema, { blockType, t }) => schema`.
    It replaces the default rules, `defaultInnerBlockSchemaEnhancer`: images don't offer width, size, or alignment, and teasers don't offer a background.

Set them from an add-on in both {file}`config/plate-editor.ts` and {file}`config/plate-renderer.ts`, since the published view uses the backgrounds and the heading level too.
See {doc}`add-plate-plugins` for how these modules are loaded.
Reconfigure the plugin that's already in the list, so it keeps its component.

```ts
// my-addon/config/plate-editor.ts
import type { PlateEditorExtension } from '@plone/plate/extensions';

export const accordionOptions = {
  allowedBlocks: ['p', 'table', 'hr', 'image'],
  themes: [
    { id: 'white', label: 'White', color: '#ffffff' },
    { id: 'sand', label: 'Sand', color: '#f3ead8' },
  ],
  headingLevel: 2 as const,
};

const extension: PlateEditorExtension = {
  plugins: (plugins) =>
    plugins.map((plugin) =>
      plugin.key === 'accordion'
        ? plugin.configure({ options: accordionOptions })
        : plugin,
    ),
};

export default extension;
```

```ts
// my-addon/config/plate-renderer.ts
import type { PlateRendererExtension } from '@plone/plate/extensions';
import { accordionOptions } from './plate-editor';

const extension: PlateRendererExtension = {
  plugins: (plugins) =>
    plugins.map((plugin) =>
      plugin.key === 'accordion'
        ? plugin.configure({ options: accordionOptions })
        : plugin,
    ),
};

export default extension;
```

Importing {file}`plate-editor.ts` from {file}`plate-renderer.ts` loads the editor module on public pages.
Keep the options in a module of their own instead when {file}`plate-editor.ts` imports editor code.

To change the rules for an add-on block, write an enhancer that handles it and falls back to the default rules:

```ts
import {
  defaultInnerBlockSchemaEnhancer,
  withoutFields,
} from '@plone/plate/components/editor/plugins/accordion';

export const innerBlockSchemaEnhancer = (schema, context) =>
  context.blockType === 'mainslider'
    ? withoutFields(
        schema,
        ['autoplay'],
        "Sliders inside an accordion don't play on their own.",
      )
    : defaultInnerBlockSchemaEnhancer(schema, context);
```

## Style the accordion

The accordion uses the content classnames and tokens of every block.
See the accordion in {doc}`style-blocks-in-a-theme`.

## Use the accordion outside Aurora

The accordion depends only on Plate.js and `@plone/plate`.
An editor outside Aurora, such as one in Volto, gets it from the `block-editor` and `block-renderer` presets of `@plone/plate`.

Translations
:   Pass `PlateEditor` a `t` function and the `language`, or the legacy `intl` object.
    Untranslated strings fall back to English.

Styles
:   Load {file}`@plone/plate/styles/content.css` for the published view and the blocks in the editor.

Settings
:   The settings of the accordion and its panels open in a popover from the accordion's label and the panels' Settings buttons.
    A host with a settings sidebar passes `settingsContainer`, a function that returns the sidebar's element, to `PlateEditor`, and the settings render there instead.

Notifications
:   `PlateEditor` renders a sonner `Toaster` for its notifications, such as the Undo after deleting a panel.
    A host that already renders one passes `toaster={false}`.

Plone blocks
:   Image, Teaser, and Listing blocks in panels need the Plone block adapter, which Aurora's `somersault` presets include.
    Without it, panels hold paragraphs, tables, and separators.

Block settings
:   A host that renders block settings in its own form runs each block's schema through `enhanceInnerBlockSchema(editor, path, schema, blockType)`, from {file}`@plone/plate/components/editor`, so blocks inside an accordion only offer the settings that apply there.
    It can render `InnerBlockSettingsHeader`, from {file}`@plone/plate/components/ui/accordion-settings`, above the form, for the block's place in the accordion, and hide the block's form while `useAccordionSettingsTarget()` returns a value, since the accordion's or a panel's settings take its place.
