# AGENTS.md

This file applies only to `packages/aurora` and its subdirectories.

## What This Package Is

- `@plone/aurora` is the **Plone Aurora framework**: what a Plone Aurora app installs to build on Plone Aurora.
- It doesn't run on its own. The app in `apps/aurora` (`@plone/aurora-dev`, private) runs it in this repository, and projects run it in their own app.
- It's being built up in steps, see plone/aurora#452. Today it has:
  - `@plone/aurora/vite`: `PloneAuroraVitePlugin()`, the Vite plugins and configuration of an app. It goes before React Router's plugin in the app's `vite.config.ts`.
  - `@plone/aurora/registry.config` and `@plone/aurora/registry-publicui.config`: the official add-ons, which an app's `registry.config.ts` extends.

## Package Model

- TypeScript in `src/`, compiled with **tsup** to `dist/`, ESM only. Each entry runs in Node.js, at build time.
- It's released as `@plone/aurora`, with the history of the app that had this name before: `CHANGELOG.md`, `news/` and the git tags (`${version}`) continue here.

## Editing Rules

- Packages must not import `@plone/aurora`: it builds on them. The `Packages - no imports from the app` lint rule enforces it.
- Babel presets and plugins resolve from the app's folder when given by name, so pass them resolved from this package (`require.resolve`).
- Keep `optimizeDeps.include` in `src/vite.ts` in sync with the packages: `pnpm check:vite-optimize-deps` audits it.

## Validation

```sh
pnpm --filter @plone/aurora build
pnpm --filter @plone/aurora check:ts
pnpm --filter @plone/aurora-dev build
```
