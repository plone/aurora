---
myst:
  html_meta:
    "description": "This upgrade guide lists all breaking changes in Plone Aurora, and explains the necessary steps to upgrade your add-on for the latest version."
    "property=og:description": "This upgrade guide lists all breaking changes in Plone Aurora, and explains the necessary steps to upgrade your add-on for the latest version."
    "property=og:title": "Plone Aurora upgrade guide"
    "keywords": "Plone Aurora, Plone, frontend, React, upgrade, guide"
---

(plone-aurora-upgrade-guide)=

# Upgrade guide

This upgrade guide lists all breaking changes in Plone Aurora, and explains the necessary steps to upgrade your add-on for the latest version.
Plone Aurora uses Semantic Versioning, as described in {doc}`../contributing/version-policy`.

````{note}
[Cookieplone](https://github.com/plone/cookieplone) is the official project generator for Plone.
We keep Cookieplone up to date and in sync with the current Plone Aurora release.

To make it easier for you to maintain your projects, you should keep all your code inside your project add-ons.
If you do so, when you want to upgrade your project, you can generate a new project using Cookieplone with the same name as your old one, and copy over your add-ons to the new project.
It is usually better and quicker to move your items into new locations and copy your dependencies than dealing with following the upgrade steps, regardless of whether you have modified the boilerplate.

```{seealso}
{ref}`upgrade-18-cookieplone-label`
```
````

(plone-aurora-upgrade-guide-1.x.x)=

## Upgrading to Plone Aurora

(upgrade-guide-block-content-css)=

### Block content is styled in `styles/content.css`

```{versionchanged} 1.0.0-alpha.19
These steps apply when you upgrade an add-on from Plone Aurora 1.0.0-alpha.18 or earlier to 1.0.0-alpha.19 or later.
```

Block content no longer depends on Tailwind.
Blocks are styled with plain CSS classnames, in each add-on's {file}`styles/content.css`, which the app loads in both the Public UI and the CMSUI editor inside the new `plone-content` cascade layer.
Themes can style blocks with any CSS approach and any reset, and editors see blocks as visitors do.
{doc}`/how-to-guides/style-blocks-in-a-theme` lists every block's classnames and tokens.

Nothing was deprecated: the changes below take effect directly.

#### The `cmsui` cascade layer is removed

```{versionremoved} 1.0.0-alpha.19
The `cmsui` cascade layer.
```

The CMSUI used to wrap Tailwind in a `cmsui` cascade layer, the last one in the layer order.
Tailwind is now loaded with a plain import, so its reset lands in `base`, its theme variables in `theme`, and its utilities in `utilities`.
The reset now sits below every other layer, instead of overriding component styles.

If your add-on puts styles in `@layer cmsui`, move them to one of the layers declared in `config.settings.cssLayers`, such as `custom` for overrides, or `components` for component styles.

```diff
-@layer cmsui {
+@layer custom {
   .my-widget {
     padding: 1rem;
   }
 }
```

If your component relied on the reset to drop the browser's or a library's styles, set those properties in the component itself.

#### Add `plone-content` if you set `config.settings.cssLayers`

```{versionadded} 1.0.0-alpha.19
The `plone-content` cascade layer, between `plone-components` and `utilities`.
```

The default layer order is now `theme`, `base`, `components`, `plone-components`, `plone-content`, `utilities`, and `custom`.
If your add-on replaces `config.settings.cssLayers` instead of extending it, add `plone-content` in the same position.

```diff
 config.settings.cssLayers = [
   'theme',
   'base',
   'components',
   'plone-components',
+  'plone-content',
   'utilities',
   'custom',
 ];
```

#### Move block styles to `styles/content.css`

```{versionadded} 1.0.0-alpha.19
The {file}`styles/content.css` add-on entry point, loaded in both the Public UI and the CMSUI.
```

Styles in {file}`styles/publicui.css` only apply to the Public UI.
Move the rules that target block content into a new {file}`styles/content.css` at the root of your add-on, so they also apply in the editor.
Don't wrap them in a `@layer`: the loader puts the whole file in `plone-content`.
See {doc}`/conceptual-guides/add-on-styles-loader` for the authoring rules.

The CMSUI editor's content root now has the `content-area` class, as in the Public UI.
Rules and tokens you set on `.content-area` now apply in the editor too.

#### Block content has no Tailwind classes

```{versionchanged} 1.0.0-alpha.19
The Plate.js blocks are styled by `@plone/plate/styles/content.css` instead of Tailwind utilities.
```

The Plate.js blocks, such as paragraphs, headings, lists, code blocks, tables, callouts, toggles, columns, and the table of contents, no longer render Tailwind utility classes in the content.
Their styles moved from the `utilities` layer to `plone-content`, inside `:where()`, so any rule of your theme wins over them.

- If your theme's CSS targets Tailwind classes inside block content, target the block's classnames instead, such as `.slate-p`, `.block-callout`, or `.block-code_block__pre`.
- The `dark:` variants of the content are removed.
  For a dark mode, set the content tokens, such as the `--code-token-*` syntax colors, in your theme.
- The table of contents' entries are plain `<button type="button">` elements with the `block-toc__item` class.
- Comment and suggestion marks render as plain text in the Public UI.

#### Block spacing applies in the editor

```{versionchanged} 1.0.0-alpha.19
The block spacing rules moved from {file}`@plone/layout/styles/content-area.css` to {file}`@plone/layout/styles/content.css`.
```

The block widths by category, the spacing between blocks, and the nested block rules used to load only in the Public UI, in the `custom` layer.
They now load in both user interfaces, in `plone-content`, so the editor spaces blocks like the Public UI.
If your theme overrides them, move the overrides to your {file}`styles/content.css`, or set the `--block-bottom-spacing` and container width tokens.

#### Plone blocks' classnames are renamed

```{versionchanged} 1.0.0-alpha.19
The Plone blocks use the block content classnames, `block-<type>__<part>`.
```

```{versionremoved} 1.0.0-alpha.19
{file}`Video/VideoBlockView.css` and {file}`Maps/MapsBlock.module.css` in `@plone/blocks`. Their rules are in `@plone/blocks/styles/content.css`.
```

Update theme CSS that targets the old classnames.

| Block | Before | After |
|---|---|---|
| Image | `image-block` | `block-image__frame` |
| Video | `video align block <align>` (wrapper) | `block-video__wrapper` with `data-align` |
| Video | `video-block`, `video-inner`, `invalid-video-format` | `block-video__figure`, `block-video__inner`, `block-video__invalid` |
| Video | `full-width` | `[data-align="full"]` on the wrapper |
| Maps | `maps-block`, `maps-iframe` | `block-maps__frame`, `block-maps__iframe` |
| Teaser | `teaser-item`, `teaser-image-wrapper`, `teaser-content` | `block-teaser__item`, `block-teaser__image`, `block-teaser__content` |
| Listing | `item` | `block-listing__item` |
| Listing | `item summary` | `block-listing__item[data-variation="summary"]` |

#### Plate.js media nodes are removed from the Aurora editor

```{versionremoved} 1.0.0-alpha.19
The video, audio, file, media embed, upload placeholder, and caption Plate.js plugins in `BlockEditorKit` and `BlockBaseEditorKit`, and the `video`, `audio`, `file`, and `media_embed` entries of `config.blocks.plateBlocksConfig`.
```

Plone Aurora uses Plone blocks for media.
Nothing in the editor could insert the Plate.js media nodes, so this only affects content that has them, such as an embed made by pasting HTML with an `<iframe>`, which no longer renders.
Pasted `<iframe>` elements are now dropped, and their surrounding text is kept.
If your add-on needs these nodes, add them to your own editor configuration: `MediaKit` from {file}`@plone/plate/components/editor/plugins/media-kit` for the editor, and `BaseMediaKit` from {file}`@plone/plate/components/editor/plugins/media-base-kit` for the renderer.
Their components keep their Tailwind styling.

#### `EditorView` and `PlateRenderer` don't take a `variant`

```{versionremoved} 1.0.0-alpha.19
The `variant` prop of `EditorView` and `PlateRenderer` in `@plone/plate`.
```

`EditorView`, the read-only content view that `PlateRenderer` renders, no longer applies the editor's `editorVariants` classes.
Its root is styled by {file}`styles/content.css` through Plate's `slate-editor` class.
Remove the `variant` prop where you pass it.

```diff
 <PlateRenderer
   editorConfig={config}
   value={value}
-  variant="none"
 />
```

### `@plone/components` split into `@plone/quanta` and `@plone/icons`

```{versionchanged} 1.0.0-alpha.16
These steps apply when you upgrade an add-on from Plone Aurora 1.0.0-alpha.15 or earlier to 1.0.0-alpha.16 or later.
```

The Quanta design system and the icon set moved out of `@plone/components` into the new `@plone/quanta` and `@plone/icons` packages.
For the import changes in your own code, see {ref}`plone-components-upgrade-guide`.

The split also affects the boilerplate that Cookieplone generates for Plone Aurora add-ons.
The Cookieplone templates are updated to match this release, so the recommended way to upgrade an existing add-on is to run the generator again over it and review the differences.
Alternatively, apply the following changes by hand.

#### Build `@plone/icons` and `@plone/quanta` before `@plone/components`

```{versionadded} 1.0.0-alpha.16
The `@plone/icons` and `@plone/quanta` packages.
```

`@plone/components` depends on `@plone/icons`, and needs its type declarations built to build its own.
In your add-on's {file}`Makefile`, add targets for both new packages, and build them before `@plone/components` in `build-deps`.

```diff
+core/packages/icons/dist: $(shell find core/packages/icons/src -type f)
+	pnpm --filter @plone/icons build
+
+core/packages/quanta/dist: $(shell find core/packages/quanta/src -type f)
+	pnpm --filter @plone/quanta build
+
 core/packages/components/dist: $(shell find core/packages/components/src -type f)
 	pnpm --filter @plone/components build
 ...
 .PHONY: build-deps
-build-deps: core/packages/registry/dist core/packages/components/dist core/packages/client/dist core/packages/react-router/dist core/packages/helpers/dist ## Build dependencies
+build-deps: core/packages/registry/dist core/packages/icons/dist core/packages/quanta/dist core/packages/components/dist core/packages/client/dist core/packages/react-router/dist core/packages/helpers/dist ## Build dependencies
```

Do the same in the `build:deps` script of your add-on's root {file}`package.json`.

```diff
-    "build:deps": "pnpm --filter @plone/registry --filter @plone/components build",
+    "build:deps": "pnpm --filter @plone/registry --filter @plone/icons --filter @plone/quanta --filter @plone/components build",
```

#### Point the SVG module declaration at `@plone/icons`

```{versionremoved} 1.0.0-alpha.16
The `@plone/components/icons` subpath export, without a deprecation period.
Use `@plone/icons/svg` instead.
```

The `*.svg?react` module declaration moved from `@plone/components/icons` to `@plone/icons/svg`.
Update the import in your add-on's {file}`types.d.ts`.

```diff
 // Extends module definitions to support importing SVGs as React components
 // using the '?react' query parameter.
-import '@plone/components/icons';
+import '@plone/icons/svg';
```

Then add `@plone/icons` to your add-on's {file}`package.json` dependencies.

```diff
   "dependencies": {
-    "@plone/components": "workspace:*"
+    "@plone/components": "workspace:*",
+    "@plone/icons": "workspace:*"
   },
```

### Forms and widgets

```{versionchanged} 1.0.0-alpha.20
These steps apply when you upgrade an add-on from Plone Aurora 1.0.0-alpha.19 or earlier to 1.0.0-alpha.20 or later.
```

The schema-driven forms (content, control panels, and block settings) now render their fields through one field renderer, keep their values in a form store from `@plone/helpers`, and pass every widget the same props, the widget contract.
For the concepts, see {ref}`form-fields-controls-and-widgets-label`.

#### Widgets receive the widget contract

```{versionchanged} 1.0.0-alpha.20
Registered widgets receive the widget contract, `FormWidgetProps` in `@plone/types`.
```

```{versionremoved} 1.0.0-alpha.20
The `error` widget prop, and the raw field schema keys that the form understands, such as `type`, `title`, and `factory`, as widget props.
```

A registered widget now receives the props described by `FormWidgetProps` in `@plone/types`.
If your add-on registers a widget, check the following changes.

-   Validation errors arrive as `invalid` and a joined `errorMessage`, instead of the `error` list.
-   `defaultValue` is the schema's `default`, not the current value.
    Read the current value from `value`.
-   The schema keys that the form understands, such as `type`, `title`, `default`, and `factory`, are no longer passed as props.
    Read the label from `label`, and the whole field schema from `schema`.
    Any other key of the field schema is still passed as a prop.
-   The form no longer passes a "Type something..." placeholder to every widget.

```diff
- function MyWidget({ title, error, defaultValue, onChange }) {
+ function MyWidget({ label, invalid, errorMessage, value, onChange }: FormWidgetProps<string>) {
```

#### The form engine changed

```{versionremoved} 1.0.0-alpha.20
`useAppForm` and the `field.Quanta` field component of `@plone/cmsui`, the `formAtom` registry utility, and `formAtom`, `blockAtomFamily`, and `useFormFieldValue` from `@plone/cmsui/routes/atoms`.
```

```{versionadded} 1.0.0-alpha.20
The form store of `@plone/helpers`: `useFormStore`, `FormProvider`, `useFormContext`, `useOptionalFormContext`, `useSchemaField`, `useFieldValue`, `useSetFieldValue`, and `useFormState`.
`SchemaFieldsets` in `@plone/cmsui`.
```

The forms no longer use TanStack Form, and `@plone/cmsui` no longer depends on `@tanstack/react-form`.

-   `useAppForm` and the `field.Quanta` field component are removed.
    Render schema fields with `SchemaFieldsets` inside a `FormProvider` instead.
-   The `formAtom` registry utility, and `formAtom`, `blockAtomFamily`, and `useFormFieldValue` from `@plone/cmsui/routes/atoms`, are removed.
    Read and write the form your component is rendered in with the hooks from `@plone/helpers`.

```diff
- const formAtom = config.getUtility({ name: 'formAtom', type: 'atom' }).method();
- const title = useAtomValue(focusAtom(formAtom, (optic) => optic.prop('title')));
+ import { useFieldValue, useSetFieldValue } from '@plone/helpers';
+
+ const title = useFieldValue<string>('title');
+ const setTitle = useSetFieldValue<string>('title');
```

#### Widgets read where the form is from `useWidgetContext`

```{versionadded} 1.0.0-alpha.20
`useWidgetContext` and `WidgetContextProvider` in `@plone/cmsui`, and the `path` prop of `ContentForm`.
```

Widgets must not read the route's loader data or the URL to know which content they are in.
Read the form's `mode`, `path`, and `containerPath` with `useWidgetContext` instead.
If your add-on renders `ContentForm`, pass it the `path` of the edited object, or of the container when adding.

```diff
- const { content } = useLoaderData<typeof editLoader>();
- const path = content['@id'];
+ import { useWidgetContext } from '@plone/cmsui/components/Form/WidgetContext';
+
+ const { path } = useWidgetContext();
```

#### Validators receive `t`

```{versionadded} 1.0.0-alpha.20
The `t` and `fieldName` arguments of `validator` utilities.
```

The `validator` utilities receive i18next's `t` and the field's name as `fieldName`, next to `formatMessage`.
Existing validators keep working.
See {ref}`validate-form-fields-label`.

#### Quanta's pickers are renamed

```{versionadded} 1.0.0-alpha.20
`AlignPicker`, `SizePicker`, and `WidthPicker` in `@plone/quanta`.
```

```{deprecated} 1.0.0-alpha.20
`AlignWidget`, `SizeWidget`, and `WidthWidget` in `@plone/quanta`.
```

The `AlignWidget`, `SizeWidget`, and `WidthWidget` components of `@plone/quanta` are controls, not widgets.
They are renamed `AlignPicker`, `SizePicker`, and `WidthPicker`.
The old names still work, but are deprecated and will be removed in a future release.

```diff
- import { AlignWidget, SizeWidget, WidthWidget } from '@plone/quanta';
+ import { AlignPicker, SizePicker, WidthPicker } from '@plone/quanta';
```

The `align`, `size`, and `width` widgets that the forms use are now adapters in `@plone/cmsui`, around these pickers.
