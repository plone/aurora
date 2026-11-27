---
myst:
  html_meta:
    "description": "How to build a Plone Aurora app for production, run it as a Node.js server or a container, and what to expect from platforms such as Vercel"
    "property=og:description": "How to build a Plone Aurora app for production, run it as a Node.js server or a container, and what to expect from platforms such as Vercel"
    "property=og:title": "Deploy a Plone Aurora app"
    "keywords": "Plone Aurora, deployment, production, React Router, Node.js, Docker, Vercel, serverless, environment variables"
---

# Deploy a Plone Aurora app

This guide explains how to build a Plone Aurora app for production and run it.
It applies to an app that depends on `@plone/aurora`, such as the frontend that {term}`Cookieplone` generates.

A Plone Aurora app is a standard React Router app with server-side rendering.
It builds with `react-router build`, and runs on a Node.js server.

## Build the app

From the app's folder, install the dependencies and build it.

```shell
pnpm install --frozen-lockfile
pnpm build
```

`pnpm build` runs `react-router build`, which writes two folders:

{file}`build/client`
:   The browser assets: the JavaScript and CSS bundles, the files of {file}`public`, and the translations of the add-ons in {file}`build/client/locales`.

{file}`build/server`
:   The server build, {file}`build/server/index.js`, which renders the pages and runs the loaders, actions and middleware.

## Run the production server

The production server is in `@plone/aurora`.
An app's {file}`server.js` imports it, and its `start:prod` script runs it with the server build.

```shell
pnpm start:prod
```

This is the same as `node server.js ./build/server/index.js`.
The server serves the files of {file}`build/client`, compresses the responses, logs the requests, and passes every other request to React Router.

To run it on another machine, copy the app's folder with {file}`build`, {file}`server.js`, {file}`package.json` and the production dependencies, which `pnpm install --prod` installs.
The server doesn't need the source files or the build tools.

(deploy-an-app-environment-variables)=

### Environment variables

Set these environment variables where the server runs.

`PLONE_API_PATH`
:   The URL of the Plone site that the app gets its content from, as the server reaches it, such as `http://backend:8080/Plone`.
    It defaults to `http://localhost:8080/Plone`.

`COOKIE_SECRET`
:   The secret that signs the app's cookies.
    Set it to a long random value, and keep it the same across restarts and across the servers of a deployment.
    Without it, the server uses a default value, and logs a warning: the app is insecure in production.

`PORT` and `HOST`
:   Where the server listens.
    They default to port `3000` on all interfaces.

`TRUST_PROXY` and `REACT_ROUTER_ALLOWED_ACTION_ORIGINS`
:   Which reverse proxies the server trusts, and which other sites may submit actions.
    The defaults work behind a proxy on the same machine or network.
    {doc}`deploy-behind-a-reverse-proxy` explains when to change them.

`NODE_ENV`
:   The server sets it to `production` when it's not set.

## Run it in a container

The frontend that Cookieplone generates has a {file}`Dockerfile`.
It builds the app in a `node` image, removes the development dependencies, and runs the production server on port `3000` as the `node` user.

```shell
docker build -t my-site-frontend .
docker run --rm -p 3000:3000 \
  -e PLONE_API_PATH=http://backend:8080/Plone \
  -e COOKIE_SECRET=change-me \
  my-site-frontend
```

The image doesn't depend on any Plone Aurora image, so you can change the Node.js version with the `NODE_VERSION` build argument.

## Deploy to a platform

A platform that builds an app and runs a Node.js server, such as a container platform or a platform as a service, runs a Plone Aurora app with these settings:

- install command: `pnpm install --frozen-lockfile`
- build command: `pnpm build`
- start command: `pnpm start:prod`
- the {ref}`environment variables <deploy-an-app-environment-variables>`

If the frontend is in a subfolder of your repository, such as {file}`frontend` in a project that Cookieplone generates, set it as the root folder of the app on the platform.
It's the pnpm workspace root, with the lock file.

(deploy-an-app-serverless)=

## Vercel and serverless platforms

Platforms such as Vercel detect a React Router app and build it with `react-router build`.
They serve {file}`build/client` from their content delivery network, and run the server build in serverless functions, without the production server of `@plone/aurora`.

```{warning}
Plone Aurora doesn't support serverless platforms yet.
The server loads the translations of the add-ons from the files in {file}`build/client/locales` at runtime.
In a serverless function, those files aren't there, so the server can't render translated pages.
```

The support for these platforms is part of the plan in [plone/aurora#452](https://github.com/plone/aurora/issues/452): the server build will include the translations, and Plone Aurora will have a server entry for platforms that run web standard `fetch` handlers.
Until then, deploy Plone Aurora as a Node.js server or a container.
