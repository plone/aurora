---
myst:
  html_meta:
    "description": "Add Plate plugins and page elements to the page editor and the page renderer from an add-on"
    "property=og:description": "Add Plate plugins and page elements to the page editor and the page renderer from an add-on"
    "property=og:title": "Add Plate plugins from an add-on"
    "keywords": "Plone Aurora, Plate, plugins, page element, slash menu, floating toolbar, add-on"
---

# Add Plate plugins from an add-on

This guide shows how an add-on adds Plate plugins to the page editor and the page renderer, such as a new page element or a plugin that changes the editor's behavior, without shadowing the editor presets.
Several add-ons can each add their own plugins.

As an example, it adds an `alert` element, a highlighted message.

## Where each part goes

An add-on contributes code to the editor and the renderer through two modules at its root, which the `@plone/registry` Vite plugin collects at build time.

{file}`config/plate-editor.ts`
:   The editor plugins, and the add-on's slash menu items and floating toolbar buttons.
    It's only loaded with the editor, in the CMSUI.

{file}`config/plate-renderer.ts`
:   The static plugins that render the page document, read-only.
    It's loaded with the page renderer, in the Public UI and on the server.

The add-on's configuration in its {file}`index.ts` only declares data, such as the element's category and block widths.

```{important}
Don't import the plugins, nor these two modules, from the add-on's {file}`index.ts`.
The registry configuration is loaded in every bundle, on the client and on the server, so the editor code would end up in all of them.
Likewise, don't import editor code from {file}`config/plate-renderer.ts`, or it will be loaded on every public page.
```

## Add the editor plugin

Create the editable element with `createPlatePlugin`, and export it from {file}`config/plate-editor.ts` as a `PlateEditorExtension`.

```tsx
// my-addon/config/plate-editor.tsx
import { createPlatePlugin, PlateElement } from 'platejs/react';
import { TriangleAlertIcon } from 'lucide-react';
import type { PlateEditorExtension } from '@plone/plate/extensions';
import { insertBlock } from '@plone/plate/components/editor/transforms';

const AlertPlugin = createPlatePlugin({
  key: 'alert',
  node: {
    isElement: true,
    component: (props) => <PlateElement {...props} />,
  },
});

const extension: PlateEditorExtension = {
  plugins: [AlertPlugin],
  slashMenu: {
    extendGroups: (groups, editor, { t }) =>
      groups.map((group) =>
        group.group === 'Text blocks'
          ? {
              ...group,
              items: [
                ...group.items,
                {
                  icon: <TriangleAlertIcon />,
                  value: 'alert',
                  label: t?.('my-addon.alert', { defaultValue: 'Alert' }),
                  keywords: ['warning', 'note'],
                  onSelect: (editor, value) => insertBlock(editor, value),
                },
              ],
            }
          : group,
      ),
  },
};

export default extension;
```

`insertBlock` inserts an element of the given type after the current block.

### Plugins

`plugins` is either a list of plugins, which are added after the core plugins and the plugins of the add-ons loaded before, or a function that gets that list and returns a new one.
Use a function to insert a plugin before another one, or to remove one.

```ts
plugins: (plugins) => plugins.filter((plugin) => plugin.key !== 'toggle'),
```

Plate merges the plugins that share a key, and the later one wins.
So you can also reconfigure a core plugin by adding it again with `.configure()`, or disable it with `.configure({ enabled: false })`.

### Slash menu

`slashMenu.extendGroups` gets the groups of the slash menu, with the changes of the add-ons loaded before, and returns the new groups.
Add items to a group, add a group of your own, or remove or reorder items.

### Floating toolbar

`floatingToolbar` gets the component that renders the floating toolbar buttons, and returns the new one.

```tsx
import { ToolbarGroup } from '@plone/plate/components/ui/toolbar';

const extension: PlateEditorExtension = {
  floatingToolbar: (Buttons) =>
    function ButtonsWithAlert() {
      return (
        <>
          <Buttons />
          <ToolbarGroup>{/* your buttons */}</ToolbarGroup>
        </>
      );
    },
};
```

## Add the renderer plugin

The page renderer uses static plugins, created with `createSlatePlugin`, and static components.
Export them from {file}`config/plate-renderer.ts` as a `PlateRendererExtension`.

```tsx
// my-addon/config/plate-renderer.tsx
import { createSlatePlugin } from 'platejs';
import { SlateElement } from 'platejs/static';
import type { PlateRendererExtension } from '@plone/plate/extensions';

const BaseAlertPlugin = createSlatePlugin({
  key: 'alert',
  node: {
    isElement: true,
    component: (props) => <SlateElement {...props} />,
  },
});

const extension: PlateRendererExtension = {
  plugins: [BaseAlertPlugin],
};

export default extension;
```

Without a renderer plugin, the element doesn't render in the Public UI.

## Configure the element

Declare the element's category and block widths in `config.blocks.plateBlocksConfig`, in the add-on's configuration.

```ts
// my-addon/index.ts
import type { ConfigType } from '@plone/registry';

export default function install(config: ConfigType) {
  config.blocks.plateBlocksConfig.alert = {
    category: 'common',
    blockWidth: {
      defaultWidth: 'narrow',
      widths: ['narrow', 'default'],
    },
  };
  return config;
}
```

## Style the element

The element renders with the `.slate-alert` classname, both in the editor and in the Public UI.
Style it in the add-on's {file}`styles/content.css`, as {doc}`/conceptual-guides/add-on-styles-loader` describes.

```css
/* my-addon/styles/content.css */
:where(.slate-alert) {
  padding: 1rem;
  border-left: 4px solid var(--alert-border-color, currentColor);
}
```

## How the modules are loaded

The `@plone/registry` Vite plugin generates two loaders in the {file}`.plone` directory of the app, {file}`registry.plate.editor.js` and {file}`registry.plate.renderer.js`.
Each one imports the {file}`config/plate-editor` or {file}`config/plate-renderer` module, with a {file}`.ts`, {file}`.tsx`, {file}`.js`, or {file}`.jsx` extension, of every add-on that has one.
The page editor and the renderer import them as `@plone/registry/plate-editor` and `@plone/registry/plate-renderer`, and apply the modules in add-on order, the same order in which the add-ons' configurations are applied.

Only the editor and the renderer import these loaders, so the code of your modules is only loaded with them.
Outside of an app that uses the Vite plugin, such as in the unit tests or the Storybook of a package, both resolve to an empty list.

```{important}
These files are generated and maintained by `@plone/registry`.
You should not modify them.
They're overwritten in the next bundler run.
```

Changes to your modules reload like any other module.
After you add a new {file}`config/plate-editor.ts` or {file}`config/plate-renderer.ts` file to an add-on, restart the development server.
