# AGENTS.md

This file applies only to `packages/aurora` and its subdirectories.

## What This Package Is

- `@plone/aurora` is the **Plone Aurora framework**: what a Plone Aurora app installs to build on Plone Aurora.
- It doesn't run on its own. The app in `apps/aurora` (`@plone/aurora-dev`, private) runs it in this repository, and projects run it in their own app.
- It's being built up in steps, see plone/aurora#452. Today it has:
  - `@plone/aurora/vite`: `PloneAuroraVitePlugin()`, the Vite plugins and configuration of an app. It goes before React Router's plugin in the app's `vite.config.ts`.
  - `@plone/aurora/preset`: `ploneAurora()`, the React Router preset of an app, in its `react-router.config.ts`. It generates the Plone registry files, including the add-ons' routes, before React Router evaluates `routes.ts`, so `react-router dev`, `build` and `typegen` work without `init-loaders`.
  - `@plone/aurora/registry.config` and `@plone/aurora/registry-publicui.config`: the official add-ons, which an app's `registry.config.ts` extends.
  - `@plone/aurora/routes`: `auroraRoutes()`, the framework's own routes (`ok`, `@reset-fetcher`), and `getAddonRoutesConfig()`, for the app's `routes.ts`.
  - `@plone/aurora/app/*`: the runtime of an app, as source: the root route (`app/root`, client-safe, and `app/root.server`, its middleware and loader), the entries (`app/entry.client`, `app/entry.server`), the middleware (`app/middleware.server`) and the i18n setup (`app/i18next.server`). The app's own files re-export them.
  - `@plone/aurora/server` and the `plone-aurora-serve` bin: the production Express server.

## Package Model

- Two kinds of entries:
  - Build time (`vite`, `preset`, `routes`, `registry.config`): TypeScript in `src/`, compiled with **tsup** to `dist/`, ESM only, run by Node.js.
  - Runtime (`src/app/`): shipped as source, like the add-ons, and compiled by the app's Vite. `PloneAuroraVitePlugin()` keeps `@plone/aurora` out of Vite's dependency pre-bundling.
- `server.js` is plain JavaScript, run by Node.js.
- An app depends on `@plone/aurora` only, besides React, React Router and its build tools. This package depends on the official add-ons and on every library its runtime and configuration use:
  - The registry resolves the add-ons that the app registers by name through the app's dependencies.
  - `PloneAuroraVitePlugin()` prefixes the `optimizeDeps.include` entries that the app can't resolve with `@plone/aurora > `, and bundles every `@plone/*` package into the server build, so there's one `@plone/registry`.
  - `pnpm check:thin-app` builds and serves `apps/aurora` outside the workspace, with the packed packages, as a project does.
- It's released as `@plone/aurora`, with the history of the app that had this name before: `CHANGELOG.md`, `news/` and the git tags (`${version}`) continue here.

## Editing Rules

- Packages must not import `@plone/aurora`: it builds on them. The `Packages - no imports from the app` lint rule enforces it.
- Babel presets and plugins resolve from the app's folder when given by name, so pass them resolved from this package (`require.resolve`).
- Keep server-only code out of `src/app/root.tsx` and the other client modules: React Router only strips `loader` and `middleware` from the app's route file, so the server parts live in `*.server.ts` modules that the app re-exports.
- Don't use Tailwind classes in `src/app/`: Tailwind scans the app's folder and the add-ons that depend on `tailwindcss`, not this package, so the classes would be missing from the CSS. The error page uses inline styles.
- The runtime runs inside the app: use the working directory for the app's files (as `i18next.server.ts` does for `public/locales` in development), not paths relative to this package.
- Keep `optimizeDeps.include` in `src/vite.ts` in sync with the packages: `pnpm check:vite-optimize-deps` audits it.

## Validation

```sh
pnpm --filter @plone/aurora build
pnpm --filter @plone/aurora check:ts
pnpm --filter @plone/aurora test --run
pnpm --filter @plone/aurora-dev build
# After make build-deps and pnpm --filter @plone/controlpanels build:css
pnpm check:thin-app
```
