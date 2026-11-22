---
myst:
  html_meta:
    "description": "How Plone Aurora works behind a reverse proxy that terminates TLS, and how to configure which proxies it trusts"
    "property=og:description": "How Plone Aurora works behind a reverse proxy that terminates TLS, and how to configure which proxies it trusts"
    "property=og:title": "Deploy behind a reverse proxy"
    "keywords": "Plone Aurora, deployment, reverse proxy, TLS, HTTPS, React Router, actions, trust proxy, TRUST_PROXY, REACT_ROUTER_ALLOWED_ACTION_ORIGINS"
---

# Deploy behind a reverse proxy

This guide explains how Plone Aurora works behind a reverse proxy or a content delivery network, and how to configure it when the defaults don't fit.
It applies when the proxy terminates Transport Layer Security (TLS) and forwards plain HTTP to Plone Aurora.

## How it works

React Router rejects an action whose `Origin` request header doesn't match the origin of the request it receives.
It compares the full origin, including the scheme.

Behind a proxy that terminates TLS, the request reaches Plone Aurora as plain `http`, while the browser sends an `https` origin, such as `Origin: https://www.example.org`.
The proxy passes the original scheme in the `X-Forwarded-Proto` request header.

`pnpm start:prod` runs the Plone Aurora production server.
It trusts the `X-Forwarded-*` headers of proxies on private networks, so it sees the request as `https`, and the origins match.
This works for every host your site is served on, without any configuration.

## Configure which proxies to trust

By default, the server trusts proxies that connect from the local machine or from private network addresses, including the link-local range.
This covers a proxy on the same machine, and a proxy in front of a container.

If your proxy connects from another address, set the `TRUST_PROXY` environment variable when you start the server.
It takes the values of the Express [`trust proxy`](https://expressjs.com/en/guide/behind-proxies.html) setting.

- `true` trusts every proxy.
  Use it only when clients can reach Plone Aurora through the proxy alone.
- A number trusts that many proxies in front of the server.
- A comma-separated list of addresses or address ranges trusts the proxies at those addresses.
- `false` trusts no proxy.

```shell
TRUST_PROXY=203.0.113.10 pnpm start:prod
```

If every form fails with an unexpected error, and the `POST` requests return a `400` response, the server doesn't trust your proxy.

## Allow actions from other origins

To accept actions submitted from another site, set the `REACT_ROUTER_ALLOWED_ACTION_ORIGINS` environment variable when you start the server.
It takes the hosts of those sites, separated by commas.
List hosts, not addresses: `www.example.com`, not `https://www.example.com`.

```shell
REACT_ROUTER_ALLOWED_ACTION_ORIGINS=www.example.com,example.com pnpm start:prod
```

Hosts may use the wildcards that React Router supports.
`*` matches a single subdomain level, so `*.example.com` matches `www.example.com`, but not `example.com` or `a.b.example.com`.
`**` matches one or more levels, and only as the first part, as in `**.example.com`.

When the variable is unset, React Router accepts only same-origin actions.
