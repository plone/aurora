# @plone/devtools

Development tools for Plone Aurora, as a plugin for [TanStack Devtools](https://tanstack.com/devtools).
They run in the development server only. Production builds never include them.

The panel has three tabs:

- **Active page**: the route segments that match the current URL, from the root down. For each segment it shows the add-on that contributed it, its source file, and its params, loader data and action data as collapsible JSON. A timeline lists the navigations, form submissions and fetcher calls.
- **Network**: the requests the server handled. A waterfall shows each request's middleware, loader and action calls, and the backend calls each of them made, such as the `@plone/client` calls to the Plone REST API. A backend call shows its request and response bodies. Secrets such as passwords, tokens, and `Authorization` or `Cookie` values are redacted before they leave the server.
- **Routes**: every route, as a tree or as a list, with the add-on that contributed it, its source file, and whether it has middleware (M), a loader (L) or an action (A).

Routes in Aurora come from many add-ons. The devtools read them through the app's own Vite dev server and the add-on registry, so every route is listed with its real id and its owner.

## Setup

The package has three entry points, one for each runtime.

`vite.config.ts`:

```ts
import { PloneDevtoolsVitePlugin } from '@plone/devtools/vite';

export default defineConfig({
  plugins: [...PloneDevtoolsVitePlugin(), reactRouter() /* … */],
});
```

`app/entry.server.tsx`:

```ts
export const instrumentations =
  import.meta.env.DEV && import.meta.env.PLONE_DEVTOOLS
    ? [(await import('@plone/devtools/server')).serverInstrumentation]
    : [];
```

`app/entry.client.tsx`, before hydrating:

```tsx
let instrumentations: ClientInstrumentation[] | undefined;
if (import.meta.env.DEV && import.meta.env.PLONE_DEVTOOLS) {
  const devtools = await import('@plone/devtools/client');
  devtools.mountPloneDevtools();
  instrumentations = [devtools.clientInstrumentation];
}
// <HydratedRouter instrumentations={instrumentations} />
```

`mountPloneDevtools()` mounts the devtools in a React root of their own, outside the app's tree. Don't render anything next to `<HydratedRouter />`: `useId` values depend on the tree's shape, so that would change every id and break hydration. It also waits until React has hydrated `<html>`, because TanStack Devtools sets an attribute on it that the server-rendered HTML doesn't have.

The Vite plugin sets `import.meta.env.PLONE_DEVTOOLS`. It is `true` while the development server runs with the devtools enabled, and `false` otherwise. In a production build both conditions are constant and false, so the imports are removed.

To turn the devtools off, for example for acceptance tests against the development server, set `PLONE_DEVTOOLS=false` or pass `PloneDevtoolsVitePlugin({ enabled: false })`.

## How it works

- Server timings come from React Router's instrumentation API (`instrumentations`), so route modules are not rewritten. Routes that live in add-on packages are covered too.
- Backend calls are captured with Node's `diagnostics_channel` (`http.client.*`), with no change to `@plone/client`. An `AsyncLocalStorage` links each call to the request and to the route handler that made it.
- Events travel over the TanStack Devtools event bus. The server keeps the last 500 events and replays them when a panel connects. This means the first request of a page load, which the server handles before the browser connects, still shows up.
- The panel is mounted in a React root of its own, outside the app's tree, once `<html>` is hydrated.
- The Vite plugin pre-bundles the TanStack dependencies, so the first page load doesn't trigger a dependency re-optimization and a reload.

See [plone/aurora#381](https://github.com/plone/aurora/issues/381) for the design and the plan.

> [!WARNING]
> This package is experimental. Breaking changes may occur without notice.
