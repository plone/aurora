---
myst:
  html_meta:
    "description": "An explanation of the add-on modules loader in @plone/registry"
    "property=og:description": "An explanation of the add-on modules loader in @plone/registry"
    "property=og:title": "Add-on modules loader"
    "keywords": "@plone/registry, registry, add-ons, loader, code splitting"
---

# Add-on modules loader

Add-ons configure the app through the configuration registry.
Some extension points need code instead, such as editor plugins, and that code must not go through the registry.
The registry configuration is loaded on both the client and the server, in every bundle, so anything it imports ends up there, too.

The add-on modules loader collects code from the add-ons at build time instead.
An app or add-on imports `@plone/registry/addons/<path>`, and gets the default export of the `<path>` module of every add-on that has one, in add-on order.

```ts
import editorModules from '@plone/registry/addons/config/plate-editor';

// [
//   { addon: '@plone/cmsui', module: <default export of @plone/cmsui/config/plate-editor> },
//   { addon: 'my-addon', module: <default export of my-addon/config/plate-editor> },
// ]
```

The `<path>` is relative to the root of each add-on, without extension.
The loader looks for a {file}`.ts`, {file}`.tsx`, {file}`.js`, or {file}`.jsx` file.
Add-ons without the module are left out.

Only the code that imports the collection pulls the add-on modules into its bundle chunk.
For example, if only a lazily loaded editor imports a collection, the add-on code in it is only loaded with the editor.

The code that imports a collection defines its convention: the path, and what the default export of each module must be.
For example, the Plone Aurora page editor collects `config/plate-editor` and `config/plate-renderer`.

## Generated loaders

The `@plone/registry` Vite plugin resolves each `@plone/registry/addons/<path>` import to a module that it generates in the {file}`.plone` directory of the app, such as {file}`.plone/registry.addons.config.plate-editor.js`.
The helper utility `createAddonModulesLoader` from `@plone/registry/create-addon-modules-loader` generates it.

```{important}
These files are generated and maintained by `@plone/registry`.
You should not modify them.
They're overwritten in the next bundler run.
```

Editing an add-on module reloads it like any other module.
After you add a new module to an add-on, restart the development server, so the loader includes it.

Outside of an app that uses the Vite plugin, such as in the unit tests or the Storybook of a package, `@plone/registry/addons/<path>` resolves to an empty list.

```{note}
If you use a non-Vite framework, you will have to build your own integration.
You can take the implementation of the Vite plugin as reference.
```
