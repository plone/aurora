# AGENTS.md

This file applies only to `packages/icons` and its subdirectories.

## What This Package Is

- `@plone/icons` owns the Quanta icon set for Plone Aurora: the raw SVGs, a React component per icon, the `Icon` wrapper component and its types, the `*.svg?react` type declarations, and the `PloneSVGRVitePlugin` Vite plugin.
- It is a small, static-assets package. Keep it presentational: no data logic, no i18n, no registry.

## Dependencies

- **No Plone dependencies.** Don't add any `@plone/*` package to `dependencies` or `peerDependencies`, and don't import `@plone/*` from source, tests or config. The only exceptions are the `@plone/icons` self-references in `src/svg.d.ts` and in the `vite-plugin-svgr.js` template. The dev-only `tsconfig` workspace package is fine.
- Runtime dependencies are limited to what `Icon` and the SVGR plugin need.
- When you add or remove a runtime dependency, update `optimizeDeps.include` in `apps/aurora/vite.config.ts` and run `pnpm check:vite-optimize-deps`.

## Layout

```
packages/icons/
├── vite-plugin-svgr.js  vite-plugin-svgr.d.ts   PloneSVGRVitePlugin
├── .storybook/            the Storybook, published at https://plone-icons.readthedocs.io/
└── src/
    ├── index.ts           Icon, its types, and `export * from './icons'`
    ├── Icon/Icon.tsx      the Icon component, with its stories
    ├── stories/           the Introduction (the README) and the icon Gallery
    ├── icons/<Name>Icon.tsx  one React component per icon
    ├── icons/index.ts     exports every icon component
    ├── svg/<name>.svg     raw SVG files
    ├── svg.d.ts           types for `*.svg?react` imports
    └── styles/icons.css   base `.q.icon` rules (plain CSS, no Tailwind)
```

## Icons

- Raw SVG icons live in `src/svg`.
- Ready-to-use React icon components live in `src/icons`, and import `Icon` from `'../Icon/Icon'`.
- When adding an SVG icon, also add its React component counterpart and export it from `src/icons/index.ts`.
- Keep SVG and React component names aligned.
- The package is `"sideEffects": false`; keep icon modules free of side effects so unused icons are tree-shaken.

## Storybook

- The Storybook is deployed to https://plone-icons.readthedocs.io/ from `.readthedocs.yaml`.
- Stories import from the package's own source, never from `@plone/*`. The Storybook config aliases the bare `@plone/icons` specifier to `src/index.ts`, because the SVGR template imports `Icon` from it.
- The `icon-*` sizes aren't part of this package, so `.storybook/storybook-base.css` defines them for the stories.
- The Gallery lists every export of `src/icons`, so a new icon shows up there without editing the story.

## Validation

```sh
pnpm --filter @plone/icons build
pnpm --filter @plone/icons check:ts
pnpm --filter @plone/icons check:exports
pnpm --filter @plone/icons test --run
pnpm --filter @plone/icons lint
pnpm --filter @plone/icons build-storybook
```
