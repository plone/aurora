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

### `@plone/components` split into `@plone/quanta` and `@plone/icons`

The Quanta design system and the icon set moved out of `@plone/components` into the new `@plone/quanta` and `@plone/icons` packages.
For the import changes in your own code, see {ref}`plone-components-upgrade-guide`.

The split also affects the boilerplate that Cookieplone generates for Plone Aurora add-ons.
The Cookieplone templates are updated to match this release, so the recommended way to upgrade an existing add-on is to run the generator again over it and review the differences.
Alternatively, apply the following changes by hand.

#### Build `@plone/icons` and `@plone/quanta` before `@plone/components`

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
