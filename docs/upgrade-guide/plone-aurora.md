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

(upgrade-guide-no-imports-from-the-app)=

### Add-ons don't import from the app

```{versionchanged} 1.0.0-alpha.28
These steps apply when you upgrade an add-on from Plone Aurora 1.0.0-alpha.27 or earlier to 1.0.0-alpha.28 or later.
```

```{deprecated} 1.0.0-alpha.28
Importing from `@plone/aurora/app/*` and `@plone/aurora/.plone/*` in an add-on.
```

An add-on can't know which app it runs in, so it must not import from the app.
Those imports only resolved inside the Plone Aurora monorepo, through the `@plone/aurora/*` paths of each package's {file}`tsconfig.json`.
Everything they provided now comes from packages, and the core packages no longer import from the app.

The app still exports the request contexts and `getPloneClientClass` from {file}`app/middleware.server.ts`, so your add-on keeps working for now.
These exports will be removed in a later release.
Change the imports of your add-on as follows.

| Import from the app | Replacement |
| --- | --- |
| `ploneClientContext`, `ploneContentContext`, `ploneSiteContext`, `ploneUserContext`, `ploneClearAuthCookieContext` from `@plone/aurora/app/middleware.server` | The same names from `@plone/react-router/context` |
| `getPloneClientClass` from `@plone/aurora/app/middleware.server` | `getPloneClientClass` from `@plone/react-router` |
| `getLocale(context)` from `@plone/aurora/app/i18next.server` | `context.get(ploneLocaleContext)`, with `ploneLocaleContext` from `@plone/react-router/context` |
| `RootLoader` from `@plone/aurora/app/root`, in `useRouteLoaderData` | `RootLoaderData` from `@plone/types` |
| `RootLoader` from `@plone/aurora/app/root`, in `MetaFunction` | `RootLoader` from `@plone/types` |
| `@plone/aurora/.plone/cmsui.css?url` | `@plone/registry/styles/cmsui.css?url` |
| `@plone/aurora/.plone/publicui.css?url` | `@plone/registry/styles/publicui.css?url` |

For example:

```diff
-import { ploneClientContext } from '@plone/aurora/app/middleware.server';
-import { getLocale } from '@plone/aurora/app/i18next.server';
-import type { RootLoader } from '@plone/aurora/app/root';
+import {
+  ploneClientContext,
+  ploneLocaleContext,
+} from '@plone/react-router/context';
+import type { RootLoaderData } from '@plone/types';

 export async function loader({ context }: Route.LoaderArgs) {
   const cli = context.get(ploneClientContext);
-  const locale = getLocale(context);
+  const locale = context.get(ploneLocaleContext);
   // ...
 }

-const rootData = useRouteLoaderData<RootLoader>('root');
+const rootData = useRouteLoaderData<RootLoaderData>('root');
```

`RootLoaderData` only declares the data that the app's root loader returns itself.
If your add-on reads data that a `rootLoaderData` utility adds, declare it with module augmentation, as described in {doc}`../how-to-guides/fetch-additional-data-root-loader`.

Add `@plone/react-router` to the `dependencies` of your add-on, and `@plone/types` to its `devDependencies`, if they are not there yet.
If its {file}`tsconfig.json` maps `@plone/aurora/*` to the app, or includes the app's {file}`.react-router/types`, remove those entries.

(upgrade-guide-aurora-framework-package)=

### `@plone/aurora` is the framework, and the core app is `@plone/aurora-dev`

```{versionchanged} 1.0.0-alpha.28
These steps apply when you upgrade from Plone Aurora 1.0.0-alpha.27 or earlier to 1.0.0-alpha.28 or later.
```

`@plone/aurora` is now the Plone Aurora framework, in {file}`packages/aurora` of the Plone Aurora repository: what an app installs to build on Plone Aurora.
The app that develops Plone Aurora in {file}`apps/aurora` is now `@plone/aurora-dev`, which is private and never published.
The `@plone/aurora` package continues the version history and the git tags of the app.

The framework has the following entries.

`@plone/aurora/vite`
: `PloneAuroraVitePlugin()`, the Vite plugins and configuration that the app's {file}`vite.config.ts` had: the Plone registry, Tailwind, the React Compiler, SVG imports, the Plone devtools, and the `optimizeDeps` lists.

`@plone/aurora/preset`
: `ploneAurora()`, the React Router preset of an app.
  Before React Router evaluates the app's {file}`routes.ts`, it generates the files of the Plone registry in the app's {file}`.plone` folder, including the routes that the add-ons register.

`@plone/aurora/registry.config`
: The official add-ons, which an app or an add-on repository extends in its {file}`registry.config.ts`.
  `@plone/aurora/registry-publicui.config` has the add-ons of the public UI only.

If your add-on repository runs the core app of a checkout, as the Cookieplone templates do, change the app's package name in its {file}`Makefile` and scripts.

```diff
-pnpm --filter @plone/aurora start
+pnpm --filter @plone/aurora-dev start
```

The `import { addons } from '@plone/aurora/registry.config'` in your {file}`registry.config.ts` keeps working: it now imports the list from the framework.
Run `make build-deps` after updating the checkout, because the core app now needs the built `@plone/aurora` package.

If you maintain your own app, use the framework in its {file}`vite.config.ts`, before React Router's plugin, instead of the plugins and the configuration it had.

```ts
import { reactRouter } from '@react-router/dev/vite';
import { PloneAuroraVitePlugin } from '@plone/aurora/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [PloneAuroraVitePlugin(), reactRouter()],
});
```

Add the preset to the app's {file}`react-router.config.ts`, and remove `init-loaders` from the scripts that run `react-router dev`, `react-router build` or `react-router typegen`.
Keep it before the unit tests, which don't run React Router.

```ts
import type { Config } from '@react-router/dev/config';
import { ploneAurora } from '@plone/aurora/preset';

export default {
  ssr: true,
  presets: [ploneAurora()],
} satisfies Config;
```

```diff
-    "dev": "pnpm exec init-loaders && react-router dev",
-    "build": "pnpm exec init-loaders && react-router build",
+    "dev": "react-router dev",
+    "build": "react-router build",
```

`@plone/registry` no longer generates {file}`.plone/vite.loader.js`: its Vite plugin applies the add-ons' `vite.extend` files itself.
Remove the `applyAddonViteConfiguration` import from your app's {file}`vite.config.ts`, and return the config directly.
A `vite.extend` file can no longer add or remove plugins, because Vite resolves the plugins before it runs the plugins' `config` hooks: add plugins in the app's {file}`vite.config.ts`.

(upgrade-guide-react-router-routes)=

### `getAddonRoutesConfig` moved to `@plone/react-router/routes`

```{versionchanged} 1.0.0-alpha.28
These steps apply when you upgrade from Plone Aurora 1.0.0-alpha.27 or earlier to 1.0.0-alpha.28 or later.
```

`getAddonRoutesConfig` builds the React Router route config from the registered routes, at build time.
It uses `@react-router/dev` and `node:path`, so it moved out of the main entry of `@plone/react-router`, which is runtime code, to its own `@plone/react-router/routes` entry.
Before, the main entry included a copy of the route helpers of `@react-router/dev`.

If your app's {file}`app/routes.ts` imports `getAddonRoutesConfig`, change the import.

```diff
-import { getAddonRoutesConfig } from '@plone/react-router';
+import { getAddonRoutesConfig } from '@plone/react-router/routes';
```

`@react-router/dev` is now an optional peer dependency of `@plone/react-router`.
A React Router app already has it among its `devDependencies`.

(upgrade-guide-build-plone-devtools)=

### Build `@plone/devtools` in `build-deps`

```{versionchanged} 1.0.0-alpha.27
These steps apply when you upgrade a project or an add-on from Plone Aurora 1.0.0-alpha.26 or earlier to 1.0.0-alpha.27 or later.
```

```{versionadded} 1.0.0-alpha.27
The `@plone/devtools` package.
```

The Plone Aurora app now loads the Plone devtools in its development server, from the new `@plone/devtools` package.
Its {file}`vite.config.ts` imports the package's Vite plugin, which is only available once the package is built.
Without that build, both `make start` and `make build` fail with an `ERR_MODULE_NOT_FOUND` error when Vite loads its configuration, because the production build loads the same configuration.
Production builds do not include the devtools.

The Cookieplone templates are updated to match this release, so the recommended way to upgrade an existing project or add-on is to run the generator again over it and review the differences.
Alternatively, add a target for the package to the {file}`Makefile` of your project or add-on, and add it to `build-deps`.

```diff
 core/packages/react-router/dist: $(shell find core/packages/react-router/src -type f)
 	pnpm --filter @plone/react-router build
 
+core/packages/devtools/dist: $(shell find core/packages/devtools/src -type f)
+	pnpm --filter @plone/devtools build
+
 .PHONY: build-deps
-build-deps: core/packages/registry/dist core/packages/icons/dist core/packages/quanta/dist core/packages/components/dist core/packages/client/dist core/packages/react-router/dist core/packages/helpers/dist ## Build dependencies
+build-deps: core/packages/registry/dist core/packages/icons/dist core/packages/quanta/dist core/packages/components/dist core/packages/client/dist core/packages/react-router/dist core/packages/helpers/dist core/packages/devtools/dist ## Build dependencies
```

Do the same in the `build:deps` script of the root {file}`package.json`.

```diff
-    "build:deps": "pnpm --filter @plone/registry --filter @plone/icons --filter @plone/quanta --filter @plone/components build",
+    "build:deps": "pnpm --filter @plone/registry --filter @plone/icons --filter @plone/quanta --filter @plone/components --filter @plone/devtools build",
```

To turn the devtools off in the development server, for example for acceptance tests, set the environment variable `PLONE_DEVTOOLS=false`.

(upgrade-guide-main-plate-region)=

### The page body is stored in the `main` region

```{versionchanged} 1.0.0-alpha.24
These steps apply when you upgrade from Plone Aurora 1.0.0-alpha.23 or earlier to 1.0.0-alpha.24 or later.
```

The page body is now stored in the `main` entry of `blocks`, whose `@type` is `plate`, instead of the `__somersault__` block.
Content with the old block is renamed when it is read, and keeps the new shape once it is saved.
See {doc}`../conceptual-guides/unified-editor`.

Before you deploy this version, upgrade the backend to Plone 6.2 with `plone.restapi` 10.3.0 or later.
Plone 6.2 releases that ship an older `plone.restapi` need it pinned, for example in {file}`backend/pyproject.toml`:

```toml
dependencies = [
    "Products.CMFPlone==6.2.3",
    "plone.restapi>=10.3.0",
]
```

With an older `plone.restapi`, the pages saved in the new shape drop out of `SearchableText`, get no link integrity, and the links of the blocks in them are not converted to `resolveuid` links.
Reindexing fixes the first two, but not the links, which stay as they are until the page is saved again.

With a Nick backend, upgrade it to Nick 3.1.0 or later before you deploy this version.
Older versions of Nick only read the `__somersault__` block, so they miss the Markdown, the `SearchableText` and the block types of the pages saved in the new shape.

(upgrade-guide-plone-volto-aurora-profile)=

### The backend needs the `plone.volto:aurora` profile

```{versionchanged} 1.0.0-alpha.24
These steps apply when you upgrade from Plone Aurora 1.0.0-alpha.23 or earlier to 1.0.0-alpha.24 or later.
```

Since `plone.volto` 6.1.0, which Plone 6.2.3 ships, the `plone.volto:default` profile adds the `personal_tools` actions with the links of the Volto toolbar.
The Personal tools menu of Plone Aurora shows these actions instead of its own links, so Profile and Preferences point to pages that Plone Aurora doesn't have, and Log out is missing.

`plone.volto` 6.2.0 adds the `plone.volto:aurora` profile, which replaces these actions with the links of Plone Aurora, and 6.2.1 fixes its Site Setup link.
Pin `plone.volto` to 6.2.1 or later in your backend, next to `plone.restapi`:

```toml
dependencies = [
    "Products.CMFPlone==6.2.3",
    "plone.restapi>=10.3.0",
    "plone.volto>=6.2.1",
]
```

Then apply the profile.
In a backend add-on, add it to the dependencies of your profile, in {file}`profiles/default/metadata.xml`, and add an upgrade step that applies it on existing sites:

```xml
<dependencies>
  <dependency>profile-plone.volto:aurora</dependency>
</dependencies>
```

On an existing site without an add-on, import the profile in the {guilabel}`Import` tab of `portal_setup`, in the Zope Management Interface.
The official Docker images apply it when they create a site, if you add it to the `PROFILES` environment variable, for example `PROFILES=plone.volto:aurora`.

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

#### Registered widgets are type-checked against the contract

```{versionchanged} 1.0.0-alpha.20
The widget registry types the widgets it accepts with the widget contract, `FormWidgetProps`, once `@plone/cmsui` is installed.
```

```{versionadded} 1.0.0-alpha.20
`WidgetPropsMap` and `RegisteredWidgetProps` in `@plone/types`, and the `describeWidgetContract` test helper in `@plone/cmsui/testing/widgetContract`.
```

If your add-on registers a widget whose props don't follow the widget contract, the type check now fails.
Type the widget with `FormWidgetProps`, and adapt the props it reads, as described in the previous steps.
Test it with `describeWidgetContract`, see {ref}`test-a-widget-label`.

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

#### File and image fields store files

```{versionchanged} 1.0.0-alpha.20
The fields with the `File` or `Image` factory use `FileWidget`, instead of `ImageWidget`.
```

```{versionadded} 1.0.0-alpha.20
`SelectWidget`, `ArrayWidget`, `NumberWidget`, `FileWidget`, `EmailWidget`, `PasswordWidget`, and `UrlWidget` in `@plone/cmsui`, and `NumberField` in `@plone/quanta`.
```

A field with the `File` or `Image` factory stores the file itself, such as the image of an Image, or the lead image of a News Item.
`ImageWidget` stored the URL of an image in such a field, which the content API can't save.
These fields now use `FileWidget`, which uploads the file.
`ImageWidget` stays the widget of the fields with `widget: 'image'`, which store the URL of an image, such as the image block's `url`.

If your add-on registered a widget for the `Image` factory, it still overrides `FileWidget`.

Plone Aurora now registers widgets for the fields with choices or a vocabulary, lists, numbers, files, email addresses, passwords, and URLs.
These fields used to render as text inputs.
See {ref}`core-widgets-label`.

(upgrade-guide-quanta-starter-label)=

### Quanta follows React Aria's Tailwind starter

```{versionchanged} 1.0.0-alpha.20
These steps apply when you upgrade an add-on from Plone Aurora 1.0.0-alpha.19 or earlier to 1.0.0-alpha.20 or later.
```

The components of `@plone/quanta` now have the same API as their counterparts in React Aria's Tailwind starter, so React Aria's documentation applies to them.
Their look doesn't change.
For each component, see {ref}`quanta-components-label`.

#### `Checkbox`, `Radio`, and `Switch` use React Aria's field APIs

```{versionchanged} 1.0.0-alpha.20
`Checkbox`, `Radio`, and `CustomRadio` in `@plone/quanta` are built on React Aria's `CheckboxField` and `RadioField`.
```

```{versionadded} 1.0.0-alpha.20
`Switch` in `@plone/quanta`, and the `description` and `errorMessage` props of `Checkbox`, and the `description` prop of `Radio`.
```

React Aria 1.18 deprecated its `Checkbox`, `Radio`, and `Switch` components in favor of `CheckboxField` and `CheckboxButton`, `RadioField` and `RadioButton`, and `SwitchField` and `SwitchButton`.
Quanta's `Checkbox`, `Radio`, `CustomRadio`, and the new `Switch` are built on them.

-   Their props are the props of the field: `CheckboxFieldProps`, `RadioFieldProps`, and `SwitchFieldProps`.
-   `className` styles the clickable label, as before.
    The label is now inside a wrapper `div`.
-   `Checkbox` takes `description` and `errorMessage`, and `Radio` takes `description`.
    You don't need a separate `Description` linked with `aria-describedby`.
-   `CheckboxGroup` moved to its own module.
    It's still exported from `@plone/quanta`.

#### Date controls take date values

```{versionchanged} 1.0.0-alpha.20
`DatePicker` and `DateTimePicker` in `@plone/quanta` take and return React Aria's date values, instead of ISO strings.
```

`DatePicker` and `DateTimePicker` used to take and return ISO strings, and convert date-times between UTC and the browser's time zone.
Now they work with React Aria's date values (`DateValue`), like React Aria's `DatePicker`.
Converting Plone's ISO strings is the job of the widgets.
`DateWidget` and `DateTimeWidget` in `@plone/cmsui` already do it, so the forms keep storing ISO strings.

If you use the controls directly, convert the values with the helpers in `@plone/cmsui/helpers/dates`:

```tsx
import { DateTimePicker } from '@plone/quanta';
import {
  dateValueToIsoDateTime,
  isoDateTimeToDateValue,
} from '@plone/cmsui/helpers/dates';

<DateTimePicker
  value={isoDateTimeToDateValue(value)}
  onChange={(newValue) => onChange(dateValueToIsoDateTime(newValue))}
/>;
```

Use `isoDateToDateValue` and `dateValueToIsoDate` for dates without a time.

`DatePicker` also takes `granularity`, and `Calendar` takes `visibleDuration` to show several months.

#### Unused field parts are removed

```{versionremoved} 1.0.0-alpha.20
`Field` and `FieldWrapper`, and the `minValue` prop of `TextField`, in `@plone/quanta`.
```

`Field` and `FieldWrapper` had no counterpart in React Aria's starter, and nothing in Plone Aurora used them.
Use React Aria's field components, such as `TextField`, with Quanta's `Label`, `Description`, and `FieldError`.

`TextField`'s `minValue` prop had no effect.
Remove it.

#### Collection sections take a title

```{versionchanged} 1.0.0-alpha.20
`SelectSection` and `MenuSection` in `@plone/quanta` take `title` and `items`.
```

```{versionremoved} 1.0.0-alpha.20
`SelectListBox`, `SelectSectionHeader`, `ComboBoxListBox`, and `MenuSectionHeader` in `@plone/quanta`.
```

```{versionadded} 1.0.0-alpha.20
`ListBox`, `ComboBoxSection`, and `GridListHeader` in `@plone/quanta`, and multiple selection in `ComboBox`.
```

Like in React Aria's starter, the sections of `Select`, `ComboBox`, and `Menu` render their header from a `title` prop, and their items from `items` or their children.

```diff
- <SelectSection id="fruit">
-   <SelectSectionHeader>Fruit</SelectSectionHeader>
-   <SelectItem id="apple">Apple</SelectItem>
- </SelectSection>
+ <SelectSection id="fruit" title="Fruit">
+   <SelectItem id="apple">Apple</SelectItem>
+ </SelectSection>
```

`MenuSection` works the same way, with `title` instead of `MenuSectionHeader`.
If you composed your own select with `SelectListBox`, use `ListBox`, which `@plone/quanta` now exports.

The collection components no longer require their item type to be an object, like React Aria's.

#### `Tabs` uses composition

```{versionchanged} 1.0.0-alpha.20
`Tabs` in `@plone/quanta` takes its tabs and panels as children, instead of a `tabs` prop.
```

```{versionadded} 1.0.0-alpha.20
`TabPanels`, `ToggleButton`, `ToggleButtonGroup`, and `ProgressBar` in `@plone/quanta`, and the pending spinner of `Button`.
```

Like React Aria's `Tabs`, Quanta's `Tabs` takes a `TabList` with a `Tab` for each tab, and a `TabPanel` for each panel.

```diff
- <Tabs
-   tabs={[
-     { id: 'blocks', title: 'Blocks', content: <BlocksEditor /> },
-     { id: 'content', title: 'Content', content: <ContentFields /> },
-   ]}
- />
+ <Tabs>
+   <TabList>
+     <Tab id="blocks">Blocks</Tab>
+     <Tab id="content">Content</Tab>
+   </TabList>
+   <TabPanel id="blocks">
+     <BlocksEditor />
+   </TabPanel>
+   <TabPanel id="content">
+     <ContentFields />
+   </TabPanel>
+ </Tabs>
```

`orientation` is React Aria's prop, and still works.

#### `DropZoneText` is renamed `Text`

```{versionchanged} 1.0.0-alpha.20
`DropZoneText` in `@plone/quanta` is renamed `Text`, like in React Aria's starter.
```

```diff
- import { DropZone, DropZoneText } from '@plone/quanta';
+ import { DropZone, Text } from '@plone/quanta';
```

#### `ToolbarProps` is removed

```{versionremoved} 1.0.0-alpha.20
The `ToolbarProps` type in `@plone/quanta`.
```

It was React Aria's `ToolbarProps`.
Import it from `react-aria-components` instead.

#### `Sheet` is added

```{versionadded} 1.0.0-alpha.20
`Sheet` in `@plone/quanta`.
```

`Sheet` is React Aria's sheet, with Quanta's styles.
With `position="right"` or `position="left"`, it's a full-height side panel, such as a settings panel next to the editor.
With `position="bottom"`, it's a sheet that slides up, as on phones.
On touch devices, you can swipe it away.
For the details, see {ref}`quanta-side-panel-label`.

#### `MultiSelect` is a controlled component

```{versionchanged} 1.0.0-alpha.20
`MultiSelect` in `@plone/quanta` takes its selected items as `value` and reports them with `onChange`.
```

```{versionremoved} 1.0.0-alpha.20
The `selectedItems`, `creatable`, `onItemInserted`, `onItemCleared` and `renderEmptyState` props of `MultiSelect`, and the `Option` type, in `@plone/quanta`.
```

`MultiSelect` is now built on Quanta's `ComboBox` and `TagGroup`, and `ArrayWidget` in `@plone/cmsui` uses it.
It's a controlled component, like the other Quanta fields:

```diff
- const selectedItems = useListData({ initialItems: [] });
- <MultiSelect items={items} selectedItems={selectedItems} creatable />
+ const [value, setValue] = useState<MultiSelectItem[]>([]);
+ <MultiSelect items={items} value={value} onChange={setValue} allowsCustomValue />
```

Its items are `MultiSelectItem` objects, with an `id` and a `name`.
`allowsCustomValue`, React Aria's name for it, replaces `creatable`, and defaults to `false`.
To search the items on a server, pass `inputValue` and `onInputChange`.
