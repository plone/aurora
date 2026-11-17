---
myst:
  html_meta:
    "description": "How to add custom endpoints to the Plone client"
    "property=og:description": "How to add custom endpoints to the Plone client"
    "property=og:title": "Add custom endpoints to the Plone client"
    "keywords": "Plone Aurora, @plone/client, @plone/registry, endpoints, REST API, add-on, guide"
---

# Add custom endpoints to the Plone client

Plone Aurora gives every request a Plone client (`@plone/client`) instance, which loaders and actions read from the `ploneClientContext`.
The client ships with methods for the endpoints of `plone.restapi`.
When your backend add-on provides its own REST API endpoints, you can add methods for them to that same client instance.
Your methods then get the same authentication, API path, and error handling as the core ones.

## Write the endpoint

An endpoint is a function that receives the client as `this`.
Use `apiRequest` from `@plone/client` to send the request.
It builds the backend URL from `this.config.apiPath`, adds the `Authorization` header when the user is authenticated, and rejects with `{ status, data }` on error.

```{code-block} ts
:caption: packages/\<add-on-name>/client/getIdentityProviders.ts
import { apiRequest } from '@plone/client';
import type PloneClient from '@plone/client';
import type { RequestResponse } from '@plone/client';

export type IdentityProvidersResponse = {
  options: { id: string; title: string; url: string }[];
};

export async function getIdentityProviders(
  this: PloneClient,
): Promise<RequestResponse<IdentityProvidersResponse>> {
  return apiRequest('get', '/@login', { config: this.config });
}
```

`apiRequest` takes the HTTP method, the path relative to the site root, and an options object with:

`config`
:   The client configuration. Always pass `this.config`.

`params`
:   Query string parameters.

`data`
:   The request body.

`headers`
:   Additional request headers.

## Type the endpoint

Add your methods to the `PloneClientExtensions` interface of `@plone/client` through module augmentation.
Every place typed with `PloneClient`, such as `context.get(ploneClientContext)`, then knows about them.

```{code-block} ts
:caption: packages/\<add-on-name>/client/index.ts
import { getIdentityProviders } from './getIdentityProviders';

export const clientEndpoints = { getIdentityProviders };

declare module '@plone/client' {
  interface PloneClientExtensions {
    getIdentityProviders: typeof getIdentityProviders;
  }
}
```

## Register the endpoint

Register a `clientEndpoints` utility in your add-on's server configuration.
Its `method` returns an object with your endpoint methods.

```{code-block} ts
:caption: packages/\<add-on-name>/config/server.ts
import type { ConfigType } from '@plone/registry';
import { clientEndpoints } from '../client';

export default function install(config: ConfigType) {
  config.registerUtility({
    name: '<add-on-name>',
    type: 'clientEndpoints',
    method: () => clientEndpoints,
  });

  return config;
}
```

On each request, Plone Aurora takes the class registered as the `ploneClient` utility and adds the methods of every registered `clientEndpoints` utility.
Use your add-on name as the `name` of the utility, so several add-ons can register their own endpoints without replacing each other's.
If two add-ons provide a method with the same name, the one registered last wins.
A method with the same name as a core method, such as `getContent`, replaces the core method.

## Use the endpoint

Call your endpoint from a loader or action like any core method.

```{code-block} tsx
:caption: packages/\<add-on-name>/routes/login.tsx
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import type { Route } from './+types/login';

export async function loader({ context }: Route.LoaderArgs) {
  const cli = context.get(ploneClientContext);

  const { data } = await cli.getIdentityProviders();

  return { providers: data.options };
}
```

## Use the endpoint outside Plone Aurora

`@plone/client` does not depend on Plone Aurora.
In a script, a test, or another framework, call `PloneClient.extend()` directly.
It returns a subclass of the class it's called on, with the given methods added, and doesn't modify the original class.

```ts
import PloneClient from '@plone/client';
import { clientEndpoints } from '<add-on-name>/client';

const MyPloneClient = PloneClient.extend(clientEndpoints);

const cli = MyPloneClient.initialize({
  apiPath: 'http://localhost:8080/Plone',
});

const { data } = await cli.getIdentityProviders();
```

The returned class has types for the added methods, even without module augmentation.
You can chain `extend()` calls, and `initialize()` returns an instance of the class it's called on.
