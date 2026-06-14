---
myst:
  html_meta:
    "description": "How to declare Vite optimizeDeps for add-ons in Aurora"
    "property=og:description": "How to declare Vite optimizeDeps for add-ons in Aurora"
    "property=og:title": "Vite dependency pre-bundling"
    "keywords": "Plone Aurora, Vite, optimizeDeps, pnpm, add-ons"
---

# Vite dependency pre-bundling

This guide shows you how to declare third-party dependencies for pre-bundling so Vite resolves them at startup rather than lazily during dev.

Aurora runs in a pnpm monorepo.
Vite treats workspace packages as source files and does not scan them upfront for their third-party dependencies.
Instead, it discovers them the first time a page imports them, triggering a re-bundle and a browser reload.
In a large project, this causes several reload cycles and noticeably slows down the first page load in dev mode.

The fix is to declare those third-party dependencies in `optimizeDeps.include`.
Aurora uses two places for these declarations depending on whether the package is a registered add-on.

```{important}
Only declare a package as a registered add-on if it configures the application — registering slots, routes, or components into the Aurora framework.
Pure libraries such as component kits and utility packages must not be add-ons.
Registering them as add-ons causes the addon system to generate unnecessary loaders and blurs the boundary between framework participants and libraries.
If your package is a library, add its entries to `vite.config.ts` in the app that uses it.
```

## Registered add-ons: `vite.extend.js`

Any package that is a registered Aurora add-on can ship a `vite.extend.js` file in its root.
`PloneRegistryVitePlugin` picks these up automatically and merges them into the Vite config at startup — no changes to the app are needed.

The file must export a default function that receives the current config and returns a modified copy:

```js
// packages/my-addon/vite.extend.js
export default function (config) {
  return {
    ...config,
    optimizeDeps: {
      ...config.optimizeDeps,
      include: [
        ...(config.optimizeDeps?.include ?? []),
        // Use "pkg > dep" syntax for pnpm — resolves the dep through the
        // workspace package that owns it
        '@plone/my-addon > some-library',
        '@plone/my-addon > some-library/subpath',
      ],
    },
  };
}
```

### When to add an entry

Add a `"pkg > dep"` entry for every direct dependency of your add-on that is not itself a workspace package.
You do not need entries for:

- Other Aurora add-ons or workspace packages — Vite excludes them from
  optimization automatically because it treats them as source files.
- Dev dependencies.
- Peer dependencies that the host app provides.

If a dependency exports subpaths you use (for example `some-lib/react` or `some-lib/client`), add a separate entry for each subpath.
Vite does not discover subpath exports automatically from the main entry.

If a dependency is only used in server-side code (for example `*.server.*` files), add it to `ssr.optimizeDeps.include` instead of `optimizeDeps.include` so it isn't pre-bundled for the browser.

### Existing core add-on files

| Add-on | File |
|--------|------|
| `@plone/plate` | `packages/plate/vite.extend.js` |
| `@plone/layout` | `packages/layout/vite.extend.js` |
| `@plone/cmsui` | `packages/cmsui/vite.extend.js` |

## Non-add-on workspace packages and app deps: `vite.config.ts`

Packages that are not registered add-ons — currently `@plone/components` and `@plone/helpers` — cannot use `vite.extend.js` because `PloneRegistryVitePlugin` never loads their files.
List their dependencies directly in `apps/aurora/vite.config.ts` under `optimizeDeps.include`.

The same rule applies to packages that are direct dependencies of the app itself (listed in `apps/aurora/package.json`).
Those use plain names without the `>` syntax because Vite resolves them directly from the app root.

```ts
// apps/aurora/vite.config.ts
optimizeDeps: {
  include: [
    // App-level dep — plain name works
    'some-app-dep',
    // Non-add-on workspace package dep — requires "pkg > dep" syntax
    '@plone/components > react-aria-components',
    '@plone/helpers > jotai',
  ]
}
```
