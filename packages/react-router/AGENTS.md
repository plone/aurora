# AGENTS.md

This file applies only to `packages/react-router` and its subdirectories.

## What This Package Is

- `@plone/react-router` is a **thin bridge over React Router 7** for Plone Aurora.
- It provides Plone-specific wrappers for React Router hooks (`useHref`, `useLocation`, `useParams`, `navigate`) used by `@plone/providers` and other packages.

> [!WARNING]
> This package is experimental. Breaking changes may occur without notice.

## Package Model

- `src/index.ts` is the main entry point, for runtime code: the cookies, the auth helpers, and `getPloneClientClass`.
- `src/context.ts` (`@plone/react-router/context`) has the request contexts. It has no Node.js imports, so route modules can import it.
- `src/routes.ts` (`@plone/react-router/routes`) has `getAddonRoutesConfig`, which the app's `routes.ts` runs at build time. It's the only module that imports `@react-router/dev`, an optional peer dependency, and `node:path`. Keep both out of the other entries.
- Compiled with **tsup**.

## Editing Rules

- Keep this package **thin**. Do not add routing logic beyond what is needed to bridge React Router 7 APIs to Plone's conventions.
- If adding a new hook, it should wrap an existing React Router 7 hook — not reimplement routing behavior.
- Vite configuration additions should be clearly separated from hook exports.
- Do not import UI components or React context providers here.

## Validation

```sh
pnpm --filter @plone/react-router test --run
pnpm --filter @plone/react-router build
pnpm --filter @plone/react-router check:exports
```
