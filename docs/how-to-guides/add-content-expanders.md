---
myst:
  html_meta:
    "description": "How to add expandable components to the content request"
    "property=og:description": "How to add expandable components to the content request"
    "property=og:title": "Add expanders to the content request"
    "keywords": "Plone Aurora, plone.restapi, expanders, apiExpanders, components, content"
---

# Add expanders to the content request

Plone Aurora fetches the content of the current page once per request, and asks `plone.restapi` to expand a fixed set of components along with it: `navroot`, `breadcrumbs`, `navigation`, `actions`, and, for signed-in users, `types`.

If your add-on needs a component that the backend publishes as expandable, add it to that request instead of making one of your own.
Declare it in `config.settings.apiExpanders`, in your add-on's {file}`packages/<add-on-name>/config/server.ts` file:

```{code-block} ts
:caption: packages/\<add-on-name>/config/server.ts
import type { ConfigType } from '@plone/registry';

export default function install(config: ConfigType) {
  config.settings.apiExpanders = [
    ...(config.settings.apiExpanders ?? []),
    { match: '', GET_CONTENT: ['my-profile'], authenticated: true },
  ];

  return config;
}
```

Each expander has the following keys.

`match`
:   The path the expander applies to, and every path below it.
    `''` or `'/'` matches every page.
    `'/news'` matches `/news` and `/news/item`, but not `/newsletter`.

`GET_CONTENT`
:   The names of the components to expand.
    Each name is added once, even when several expanders declare it.

`authenticated`
:   Optional.
    When `true`, the expander applies to signed-in users only, so anonymous requests, and their cache keys, stay unchanged.
    It is also dropped when Plone Aurora retries a request anonymously after an expired token.

The expanded components are available in the content, as the core ones are:

```ts
const profile = content['@components']['my-profile'];
```

```{note}
Plone Aurora does not support the `querystring` key of Volto's `apiExpanders` yet.
```
