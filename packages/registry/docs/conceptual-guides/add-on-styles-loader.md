---
myst:
  html_meta:
    "description": "An explanation of the add-ons styles loader in @plone/registry"
    "property=og:description": "An explanation of the add-ons styles loader in @plone/registry"
    "property=og:title": "Add-ons styles loader"
    "keywords": "@plone/registry, registry, add-ons, loader"
---

# Add-ons styles loader

Add-ons that are compatible with the `@plone/registry` may declare styles that should be loaded by the app.
Currently, the loader loads styles for both the end user interface (Public UI) part, which displays content to both authenticated and anonymous users, and the content management system user interface (CMSUI) part of the app.

## Public UI Styles

To load Public UI styles, create a file {file}`styles/publicui.css` at the root of your add-on package to serve as the entry point.
This file is a `.css` file containing the styles that you want your app to load for the Public UI.

## CMSUI Styles

Similar to the Public UI, you can create a file {file}`styles/cmsui.css` at the root of your add-on package to serve as the entry point for the CMSUI styles.
This file is also a CSS file containing the styles that you want your app to load for the CMSUI.

`@plone/registry` has a helper utility `createAddonsStyleLoader` which generates an add-ons loader file.
That file contains the aggregated files from all the registered add-ons, keeping the order in which they were defined.
It imports each add-on's stylesheet by the path where the registry found the add-on, so it works for an add-on that the app doesn't depend on itself, and for tools that read it outside the bundler, such as the Tailwind plugin of ESLint.

This loader is also a `.css` file and is placed in the {file}`.plone` directory in the root of your application.
By default, it's called {file}`publicui.css` for the Public UI and {file}`cmsui.css` for the CMSUI.

```{important}
This file is generated and maintained by `@plone/registry`.
You should neither modify it nor add your own styles in here.
It will be overwritten in the next bundler run.
```

The add-ons loader generator is meant to be run before bundling your app or by the bundler when it runs.
The `@plone/registry` Vite plugin generates this file, so the framework can load it during app bootstrap time.

```js
const projectRootPath = path.resolve('.');
const { registry, shadowAliases } = AddonRegistry.init(projectRootPath);

createAddonsStyleLoader(registry);
```

This will create {file}`publicui.css` in the {file}`.plone` directory in the root of your app.
Afterwards, configure your app to load the CSS according to the framework's convention, and in both a centralized and performant manner.

```css
@import 'tailwind';
@import './.plone/publicui.css';
```

```{note}
If you use a Vite-powered framework, use the `@plone/registry` Vite plugin.
If you use a non-Vite framework, you will have to build your own integration.
You can take the implementation of the Vite plugin as reference.
```

## Tailwind sources

Tailwind generates only the classes it finds in the files it scans.
It doesn't scan the packages in {file}`node_modules`, so the loader adds a `@source` entry for each add-on with a stylesheet that uses Tailwind.
It also adds one for each dependency of that add-on that uses Tailwind, and for their own dependencies that use Tailwind, such as a component library that the add-on's components use.

A package uses Tailwind when it has `tailwindcss` in its `dependencies` or in its `peerDependencies`.
A package that also ships compiled CSS, for apps that don't use Tailwind, declares it as an optional peer dependency.
Tailwind's own packages and plugins, whose names start with `tailwind` or `@tailwindcss/`, are not scanned.

The loader writes the real path of each package, as the registry resolves it from the add-on's folder.
It works wherever the package manager installs them, in a workspace or in {file}`node_modules`.
Don't add `@source` entries with paths into {file}`node_modules` to your stylesheets: they depend on how the packages were installed.
