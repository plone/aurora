---
myst:
  html_meta:
    "description": "An explanation of the anatomy of a frontend add-on"
    "property=og:description": "An explanation of the anatomy of a frontend add-on"
    "property=og:title": "Frontend add-on anatomy"
    "keywords": "Plone Aurora, cookieplone, template, add-on, anatomy"
---

# Frontend add-on anatomy

This chapter explains the anatomy of a frontend add-on in Plone Aurora that was created with {term}`cookieplone`.

## Root folder structure

After you create a frontend add-on with the cookieplone generator as described in {doc}`../get-started/create-package`, the code lives in the folder {file}`packages/<add-on-name>`.

The root folder is a Plone Aurora app, which installs your add-on to develop it.
It's a standard React Router app, which installs `@plone/aurora` from npm, and a pnpm workspace, which links your add-on from {file}`packages/<add-on-name>`.
You customize Plone Aurora in your add-on, not in the app.

The generated project contains the following files and folders:

{file}`registry.config.ts`
: This file is the main entry point for your add-on configuration.
  You can programmatically register add-ons in your app.
  By default, it registers both your add-on and the official Plone Aurora add-ons.
  The default Plone Aurora set includes the {term}`CMSUI` add-ons, but you can opt in to use only the {term}`Public UI` add-ons when building a public site without CMS functionality.
  The default content is:

  ```ts
  import { addons } from '@plone/aurora/registry.config';

  addons.push('<add-on-name>'); // <add-on-name> being the actual name of your add-on

  export { addons };
  ```

{file}`package.json`
: The root {file}`package.json` is the app's.
  Its scripts run React Router: `pnpm start` runs `react-router dev`, and `pnpm build` runs `react-router build`.
  Its dependencies are `@plone/aurora`, React, React Router, and your add-on, linked from the workspace.
  To upgrade Plone Aurora, change the version of `@plone/aurora`.

{file}`pnpm-workspace.yaml`
: This file configures the pnpm workspace.
  It picks up packages in {file}`packages/*` and nested external packages in {file}`packages/**/packages/*`.
  Its `catalog` holds the versions that the app and your add-on share, such as React, React Router, and TypeScript.
  Keep `react-router` and `@react-router/dev` at the version that `@plone/aurora` uses.

{file}`app`, {file}`react-router.config.ts`, {file}`vite.config.ts`, and {file}`server.js`
: These files make the root folder a React Router app.
  They come from `@plone/aurora`: the files in {file}`app` re-export its root route and entries, {file}`react-router.config.ts` adds its preset, and {file}`vite.config.ts` adds its Vite plugin.
  In normal circumstances, you do not need to change them.
  A platform that builds React Router apps, such as Vercel, builds this app with `react-router build`.

## Add-on folder structure

The add-on folder {file}`packages/<add-on-name>` contains the folowing files and folders:

{file}`packages/<add-on-name>/package.json`
:   This file contains the metadata for your add-on package.
    The most relevant keys are the following.

    `name`
    : The name of your add-on package.

    `version`
    : The version of your add-on package.

    `main`
    :   The entry point for the add-on configuration loader.
        By default, it points to `index.ts`, which exports the function that `@plone/registry` calls to load your add-on configuration.

    `peerDependencies`
    :   The peer dependencies for your add-on package.
        By default, it includes a peer dependency on `@plone/registry`, which provides the add-on registry and loader.

    `dependencies`
    :   The runtime dependencies for your add-on package.
        Add any additional dependencies your add-on needs here.

    `devDependencies`
    :   The development dependencies for your add-on package.
        Add any development-only dependencies here.

    ```{tip}
    Avoid adding dependencies to the monorepo root's {file}`package.json`.
    Instead, add them to your add-on's {file}`package.json`.
    This ensures dependencies resolve correctly when your add-on is used in other projects.
    ```

{file}`packages/<add-on-name>/index.ts`
: This file is the main entry point for your add-on.
  It exports a default function called by the `@plone/registry` configuration loader.
  The function receives your app configuration as a parameter, which you can mutate to customize or extend defaults.
  The default content is the following.

  ```ts
  import type { ConfigType } from '@plone/registry';

  export default function loadConfig(config: ConfigType) {
    // You can mutate the configuration object in here
    return config;
  }
  ```

  ```{note}
  This file is not in a {file}`src` folder.
  Plone Aurora add-ons do not use a {file}`src` folder.
  See {ref}`add-on-packages-do-not-use-src-folder` for more information.
  ```

{file}`packages/<add-on-name>/locales/{lang}.json`
: This folder contains localization files for your add-on.
  Add one file per supported language.

## Tooling

The project includes the following tooling configurations:

{file}`tsconfig.json`
: This file is the TypeScript configuration for your add-on.

{file}`eslint.config.mjs`
: This file configures ESLint, with the TypeScript, React, React Hooks, and accessibility rules.
  You can customize it if needed.

{file}`.prettierrc`
: This file configures Prettier.
  In normal circumstances, you do not need to change this folder.

{file}`.stylelintrc`
: This file configures Stylelint.
  In normal circumstances, you do not need to change this folder.

{file}`Makefile`
: This file provides convenience make commands for common tasks.

{file}`Dockerfile`
: This file builds a Docker image for your project.
  You can use it to build and run the project in a containerized environment.
  In normal circumstances, you do not need to change this file.
  If you're building an add-on package, it's likely that you don't need this file at all.

{file}`.storybook`
: This folder contains the Storybook configuration for your add-on.
  Storybook builds and previews React UI components in isolation.
  In normal circumstances, you do not need to change this folder.
  If your add-on contains UI components, add stories to showcase them.

{file}`.github`
: This folder contains GitHub Actions workflows for linting, testing, and building your add-on.
  In normal circumstances, you do not need to change this folder.
  Customize the workflows if you need a tailored CI/CD process.

{file}`acceptance`
: This folder contains Playwright end-to-end tests for your add-on.
  Add tests in {file}`acceptance/tests` using the `*.test.ts` naming convention.
  In normal circumstances, you do not need to change the acceptance testing configuration.

## Update Plone Aurora

After a Plone Aurora release, change the version of `@plone/aurora` in the root {file}`package.json`.
If the release notes say so, also change the versions of the `catalog` in {file}`pnpm-workspace.yaml`.
Then run:

```shell
make install
```

To use packages that aren't on npm, such as an add-on from another repository, check them out in {file}`packages` with {term}`mrs-developer`, and the workspace picks them up.
