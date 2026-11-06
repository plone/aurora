# AGENTS.md

This file applies only to `packages/devtools` and its subdirectories.

## What This Package Is

- `@plone/devtools` is a TanStack Devtools plugin for Plone Aurora. It shows the active page, the network activity and the routes. It runs in the development server only.
- The design, the findings of the spike and the plan are in [plone/aurora#381](https://github.com/plone/aurora/issues/381).

## Package Model

There are three entry points, one per runtime, built with **tsup** into `dist/`:

- `src/vite.ts` → `@plone/devtools/vite`, run by Node from the app's `vite.config.ts`. It adds TanStack's Vite plugins, defines `import.meta.env.PLONE_DEVTOOLS`, collects the routes, and answers the panel.
- `src/server/index.ts` → `@plone/devtools/server`, run by Node in SSR. It contains the React Router server instrumentation and the HTTP capture (`diagnostics_channel`).
- `src/client/index.ts` → `@plone/devtools/client`, run in the browser. It contains the client instrumentation, `mountPloneDevtools()` and the panel.

Two modules are shared:

- `src/events.ts` is the event protocol.
- `src/routes.ts` maps route ids to files and owning add-ons.

## Editing Rules

- Nothing may reach production builds. App code loads `server` and `client` only behind `import.meta.env.DEV && import.meta.env.PLONE_DEVTOOLS`, and importing a module must have no side effects (`"sideEffects": false`). Subscriptions, for example, start only when the instrumentation first runs.
- Redact secrets on the server, before emitting (`src/server/redact.ts`). Never send raw bodies or headers to the panel.
- Keep server state on `globalThis`. Vite evaluates SSR modules again after changes, while `diagnostics_channel` subscribers and the replay buffer must live as long as the process.
- Import the event client from `@tanstack/devtools-event-client/production`. Its root entry is a no-op unless `NODE_ENV` is `development` when it is loaded.
- Route ids must follow React Router's rule (`createRouteId` in `src/routes.ts`). Add-on route ids are absolute file paths.
- The panel's styles are plain CSS scoped under `.pdt`. Don't use Tailwind, and don't rely on the app's CSS reset.

## Validation

```sh
pnpm --filter @plone/devtools test --run
pnpm --filter @plone/devtools check:ts
pnpm --filter @plone/devtools build
```

After a change, check the panel in a running app (`pnpm --filter @plone/aurora start`), and check that a production build (`pnpm --filter @plone/aurora build`) contains no `PloneDevtools` or `tanstack` strings.
