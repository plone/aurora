---
myst:
  html_meta:
    "description": "How to build Plone Aurora so its forms work behind a reverse proxy that terminates TLS"
    "property=og:description": "How to build Plone Aurora so its forms work behind a reverse proxy that terminates TLS"
    "property=og:title": "Deploy behind a reverse proxy"
    "keywords": "Plone Aurora, deployment, reverse proxy, TLS, HTTPS, React Router, actions, allowedActionOrigins, REACT_ROUTER_ALLOWED_ACTION_ORIGINS"
---

# Deploy behind a reverse proxy

This guide shows how to build Plone Aurora so that its forms work behind a reverse proxy or a content delivery network.
It applies when the proxy terminates Transport Layer Security (TLS) and forwards plain HTTP to Plone Aurora.

## The problem

React Router rejects an action whose `Origin` request header doesn't match the origin of the request it receives.
It compares the full origin, including the scheme.

`react-router-serve` doesn't trust the `X-Forwarded-Proto` header that the proxy sends.
It sees the request as `http`, while the browser sends an `https` origin, such as `Origin: https://www.example.org`.
The two origins differ, so React Router aborts every action with a `400` response before the action runs.
Every form fails, logging in included, and the page shows an unexpected error.

## Allow your site's hosts as action origins

Set the `REACT_ROUTER_ALLOWED_ACTION_ORIGINS` environment variable to the hosts that serve your site, separated by commas.
List hosts, not addresses: `www.example.org`, not `https://www.example.org`.
React Router accepts an action whose `Origin` header names one of these hosts.

```shell
REACT_ROUTER_ALLOWED_ACTION_ORIGINS=www.example.org,example.org pnpm build
```

Hosts may use the wildcards that React Router supports.
`*` matches a single subdomain level, so `*.example.org` matches `www.example.org`, but not `example.org` or `a.b.example.org`.
`**` matches one or more levels, and only as the first part, as in `**.example.org`.

When the variable is unset, React Router accepts only same-origin actions.

```{important}
React Router writes the list into the server build.
Set the variable where `pnpm build` runs, for example in the builder stage of your {file}`Dockerfile`.
Setting it only in the environment of the running server has no effect.
```

## Set it in a Docker image

In a {file}`Dockerfile` that builds Plone Aurora, declare a build argument, and pass it to the build.

```dockerfile
ARG REACT_ROUTER_ALLOWED_ACTION_ORIGINS=www.example.org
ENV REACT_ROUTER_ALLOWED_ACTION_ORIGINS=${REACT_ROUTER_ALLOWED_ACTION_ORIGINS}

RUN pnpm build
```

To build the same {file}`Dockerfile` for another site, pass its hosts when building the image.

```shell
docker build --build-arg REACT_ROUTER_ALLOWED_ACTION_ORIGINS=www.example.com .
```
