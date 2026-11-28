---
myst:
  html_meta:
    "description": "How to register, override, and remove routes in @plone/registry"
    "property=og:description": "How to register, override, and remove routes in @plone/registry"
    "property=og:title": "How to register, override, and remove routes in @plone/registry"
    "keywords": "Volto, Plone, frontend, React, configuration, routes, React Router"
---

# Register new routes

The `config.registerRoute` method adds a route to the configuration registry.
It saves the routes in the `config.routes` key in the configuration object.
You should provide one route at a time.
Each route must have the following data shape.

```ts
type ReactRouterRouteEntry = {
  type: 'route' | 'index' | 'layout' | 'prefix';
  path: string;
  file: string;
  options?: {
    id?: string;
    index?: boolean;
    caseSensitive?: boolean;
  };
  children?: ReactRouterRouteEntry[];
};
```

The `type`, `path`, and `file` are mandatory.
The `type` key specifies the route type to create, specifically one of `route`, `index`, `layout`, or `prefix`.
The type `route` can contain nested routes.

```{note}
The routes registered with this method must be compliant with React Router 7 routes.
They are loaded by a helper provided by `@plone/react-router` in an existing React Router 7 app.
Check the official [React Router 7 documentation](https://reactrouter.com/start/framework/routing) for more information on how to define React Router 7 routes.
```

Register a route as shown in the following example.

```ts
config.registerRoute({
  type: 'route',
  path: '/login',
  file: '@plone/cmsui/components/login.tsx',
  options: {
    id: 'login',
    index: true,
  },
});
```

You must set the module's full path name of the registered route component to make `@plone/registry` correctly address it.

## Route ids

Every route has an id.
React Router uses it in `useRouteLoaderData`, `useMatches`, and the other route APIs, and `@plone/registry` uses it to find a route to override or remove.

A route's id is its `options.id`, if you set one.
Otherwise it's the route's `file` as registered, without its extension.
The following route has the id `@plone/cmsui/routes/edit`.

```ts
config.registerRoute({
  type: 'route',
  path: '@@edit/*',
  file: '@plone/cmsui/routes/edit.tsx',
});
```

A `prefix` entry only groups routes, so it has no id.

The `routeId` function returns the id of a route entry.

```ts
import { routeId } from '@plone/registry';
```

```{note}
Two routes can't share an id.
If you register the same file for two routes, give each of them its own `options.id`.
```

## Override a route

The `config.overrideRoute` method replaces parts of a route that's already registered, for example, one registered by another add-on.
Pass the route's id and the parts to replace: `file`, `path`, `options`, or `children`.

```ts
config.overrideRoute('@plone/cmsui/routes/auth/login', {
  file: 'my-project/routes/login.tsx',
});
```

The route keeps its id, even when its file changes, so code that refers to it keeps working.
If you override the same route more than once, the changes are merged.
Setting `children` replaces all of the route's children.

## Remove a route

The `config.removeRoute` method removes a registered route and its children.

```ts
config.removeRoute('@plone/cmsui/routes/sharing');
```

## Order of add-ons

`config.overrideRoute` and `config.removeRoute` change routes that are already registered.
Apply the add-on that registers a route before the add-on that overrides or removes it.
Both methods throw an error when no route has the given id, so a typo doesn't go unnoticed.
Overriding a removed route throws an error too.

The routes registered with `config.registerRoute` are kept as they were.
The overrides and removals are applied when you read `config.routes`, so applying the configuration more than once, as hot module replacement does in development, gives the same routes.

## Routes with the same path

When two routes match the same URL, React Router picks one of them by its own ranking.
`@plone/react-router` warns about it when it builds the routes.
To replace a route, use `config.overrideRoute` instead of registering a second route on the same path.
