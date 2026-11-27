---
myst:
  html_meta:
    "description": "An explanation of the add-ons styles loader in @plone/registry"
    "property=og:description": "An explanation of the add-ons styles loader in @plone/registry"
    "property=og:title": "Add-ons styles loader"
    "keywords": "Plone Aurora, @plone/registry, registry, add-ons, loader"
---

# Add-ons styles loader

Add-ons that are compatible with the `@plone/registry` may declare styles that should be loaded by the app.
The loader loads styles for the end user interface ({term}`Public UI`) part, which displays content to both authenticated and anonymous users, for the content management system user interface ({term}`CMSUI`) part of the app, and for the block content, which both of them render.

## Public UI styles

To load Public UI styles, create a file {file}`styles/publicui.css` at the root of your add-on package to serve as the entry point.
This file is a `.css` file containing the styles that you want your app to load for the Public UI.

## CMSUI styles

Similar to the Public UI, you can create a file {file}`styles/cmsui.css` at the root of your add-on package to serve as the entry point for the CMSUI styles.
This file is also a CSS file containing the styles that you want your app to load for the CMSUI.

## Content styles

Blocks render in both the Public UI and the CMSUI editor, and they must look the same in both.
To style block content, create a file {file}`styles/content.css` at the root of your add-on package.
The app loads it in both the Public UI and the CMSUI, so you write block styles once.

The content styles of all add-ons are loaded first, inside the `plone-content` cascade layer.
This layer sits above the reset in `base` and below `utilities` and site customizations in `custom`.
The full layer order is set by `@plone/theming` in `config.settings.cssLayers`.

A theme that ships its own reset should load it into the `base` layer, for example with `@import 'modern-normalize.css' layer(base);`.
Tailwind already places its preflight there.
A reset loaded without a layer, or in a layer that isn't declared in `config.settings.cssLayers`, wins over the content styles.

### Authoring rules

Follow these rules in {file}`styles/content.css`, so the same file works under any reset and in both user interfaces.

- Set every property your rules rely on, such as margins, padding, list style, or image display.
  Don't assume a particular reset: in the Public UI, the reset depends on the theme, which may use Tailwind's preflight, another reset, or none.
- Don't declare a `@layer` in the file.
  The loader assigns the `plone-content` layer to the whole file.
- Write framework block styles inside `:where()`, so they have zero specificity and any override wins.
- Don't use CSS Modules or Tailwind utilities.
  Use the block anatomy classnames instead, such as `.block`, `.block-<type>`, `.category-<category>`, and `.slate-<type>`.
- Read values from custom properties with a fallback, such as `var(--block-caption-color, var(--muted-foreground))`, and don't declare those properties in framework styles.
  Themes then change a value by setting the property.
- Don't target `:root`, `html`, `body`, or bare element selectors such as `h1` or `figure img`.
  Declare content tokens on the `.content-area` element, which wraps the block content in both user interfaces.

### Override block styles from an add-on

A theme or any other add-on overrides block styles in its own {file}`styles/content.css`.
The override ends up in the same `plone-content` layer as the framework styles, so it applies in both the Public UI and the editor.

The framework styles use zero specificity:

```css
/* @plone/plate/styles/content.css */
:where(.slate-callout > .block-inner-container) {
  background-color: var(--block-callout-background, var(--muted));
}
```

A theme can either change a token, which is the preferred way, or override the rule:

```css
/* my-theme/styles/content.css */
.content-area {
  --block-callout-background: var(--accent-color);
}

.block-callout .block-inner-container {
  border-left: 4px solid var(--primary);
}
```

The theme's rule wins because its specificity is higher.
With equal specificity, the add-on loaded later wins.
{doc}`/how-to-guides/style-blocks-in-a-theme` lists every block's parts and tokens.

```{warning}
Don't wrap the rules of {file}`styles/content.css` in a `@layer`, not even `@layer custom`.
Because the loader imports the whole file into `plone-content`, the wrapped rules end up in a sub-layer, such as `plone-content.custom`.
Within a layer, rules placed directly in it win over its sub-layers, so your overrides would silently lose against the framework styles.
```

Styles in {file}`styles/publicui.css`, even inside `@layer custom`, only apply to the Public UI.
Use them for page-level styling, such as the header, the footer, or the layout, and use {file}`styles/content.css` for anything that targets blocks.

## Generated loaders

`@plone/registry` has a helper utility `createAddonsStyleLoader` which generates the add-ons loader files.
Each file contains the aggregated files from all the registered add-ons, keeping the order in which they were defined.
It imports each add-on's stylesheet by the path where the registry found the add-on, so it works for an add-on that the app doesn't depend on itself, such as the official add-ons that come with `@plone/aurora`.

These loaders are also `.css` files and are placed in the {file}`.plone` directory in the root of your application.
They're called {file}`publicui.css` for the Public UI, {file}`cmsui.css` for the CMSUI, and {file}`content.css` for the content styles.
Both {file}`publicui.css` and {file}`cmsui.css` import {file}`content.css` first, inside the `plone-content` layer.

```{important}
This file is generated and maintained by `@plone/registry`.
You should neither modify it nor add your own styles in here.
It will be overwritten in the next bundler run.
```

(tailwind-sources)=

### Tailwind sources

Tailwind generates only the classes that it finds in the files it scans.
It scans the app's folder, but not the packages in {file}`node_modules`.
So the loaders add a `@source` entry for each package whose classes Tailwind must generate:

- each add-on that ships the loader's stylesheet, {file}`styles/publicui.css` or {file}`styles/cmsui.css`, and uses Tailwind;
- each dependency of such an add-on that uses Tailwind, such as `@plone/quanta`;
- each dependency of those dependencies that uses Tailwind, and so on.

A package uses Tailwind when it has `tailwindcss` in its `dependencies` or in its `peerDependencies`.
Tailwind's own packages and plugins, whose names start with `tailwind` or `@tailwindcss/`, aren't scanned.

The loaders write the real path of each package, as the registry finds it from the add-on's folder.
So the classes are generated wherever the package manager installs the packages: in a pnpm workspace, or in the {file}`node_modules` of an app that installs them from npm.

```{note}
In a pnpm workspace, the Tailwind Vite plugin also scans every module that Vite compiles outside {file}`node_modules`, which includes the workspace packages.
A class that a package doesn't get through the loaders may then work in your workspace, and be missing in an app that installs the package from npm.
```

The following sections describe what this means for each kind of package.

#### Add-ons

- Declare `tailwindcss` in your add-on's `dependencies`, not in `devDependencies`.
- Ship {file}`styles/publicui.css` for the classes of your Public UI components, and {file}`styles/cmsui.css` for those of your CMSUI components.
  The file can be empty: the loaders scan an add-on only for the stylesheets it ships.
- Don't add `@source` entries with paths into {file}`node_modules` to your stylesheets.
  These paths depend on how the packages were installed, and the loaders already add the dependencies that use Tailwind.

#### Libraries that add-ons use

A library that isn't an add-on, such as a component library, but ships components with Tailwind classes, declares `tailwindcss` in its `dependencies`.
If it also ships compiled CSS, for apps that don't use Tailwind, it declares `tailwindcss` as an optional peer dependency instead:

```json
{
  "peerDependencies": {
    "tailwindcss": "^4.0.0"
  },
  "peerDependenciesMeta": {
    "tailwindcss": { "optional": true }
  }
}
```

The loaders don't find a third-party library that ships Tailwind classes, but doesn't declare `tailwindcss`.
To use one, ask its maintainers to declare it as an optional peer dependency.

#### Projects

The app of a project doesn't need any `@source` entry: Tailwind scans its folder, and the loaders add the add-ons and their dependencies.
Use Tailwind classes in an add-on of the project, with its own stylesheet, rather than in a library that the app imports directly.
