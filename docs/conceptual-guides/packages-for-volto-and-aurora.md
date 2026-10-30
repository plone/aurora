---
myst:
  html_meta:
    "description": "How to build a package that works in both Plone Aurora and Volto"
    "property=og:description": "How to build a package that works in both Plone Aurora and Volto"
    "property=og:title": "Packages for Volto and Plone Aurora"
    "keywords": "Plone Aurora, Volto, add-ons, packages, i18n, styles, driver"
---

# Packages for Volto and Plone Aurora

Some packages are meant to run unchanged in both Plone Aurora and Volto.
`@plone/plate`, the editor, works in Volto through the volto-plate add-on.
`@plone/controlpanels`, the content types control panel, works in Volto core.

The two apps differ in almost everything a UI touches: routing, translations, data fetching, styles and build.
A package works in both when it touches none of them directly, and each app connects it to its own.
This guide describes how.

## Keep the package free of either framework

The package never imports an app's framework: no `react-router`, no i18n library (`react-i18next`, `react-intl`), no `@plone/client`, `@plone/cmsui`, `@plone/components` or Volto modules.
It builds on React, React Aria Components, `@plone/quanta` and `@plone/helpers`, which work in both.

Write the rule down, and enforce it.
`@plone/controlpanels` lists its allowed dependencies in its {file}`AGENTS.md`, reports the usual offenders with ESLint's `no-restricted-imports`, and has a test, {file}`src/dependencies.test.ts`, that fails when {file}`package.json` or a source file uses anything else.

## Get app services from a provider

Whatever the package needs from the app, it gets from a provider that the app renders around it.
`ControlPanelsProvider` takes:

`navigate` and `useHref`
:   The app's router, passed to React Aria Components' `RouterProvider`, so links navigate without reloading the page.

`t`
:   Translations. See [](#translations).

`notify`
:   Notifications. Aurora shows its toasts, Volto its `Toast`.

`useBlocker`
:   Holding back navigation while there are unsaved changes. Aurora passes React Router's `useBlocker`, Volto a hook on `history.block`.

Each has a default, so the screens also run without an app, such as in Storybook and tests.

## Get data from a driver

When the package reads and writes backend data, it doesn't call the backend itself.
It declares an interface, a driver, and each app passes one.
`@plone/controlpanels` has `ContentTypesDriver`:

- Aurora's driver calls Aurora's resource routes, which call plone.restapi on the server with the user's credentials.
- Volto's driver calls plone.restapi in the browser, through Volto's `Api`.
- Storybook and the unit tests use a mock driver, with fixtures from a real site, so the screens can be built before the backend has what they need.

The plone.restapi part is shared: `createRestApiDriver(request, backend)` takes the app's way to call plone.restapi.

A driver also says what its backend can do, with `capabilities`.
The screens hide or disable what the backend can't do yet, so they work with the released plone.restapi and gain features as new services land.
`detectRestApi` finds out which services the backend has.

(translations)=

## Translations

Both packages follow the same contract, which is react-i18next's.

- **The app passes a `t` function:** react-i18next's `t` as is, or an adapter with its shape, `t(key, { defaultValue, ...values })`.
  Apps on react-intl, such as Volto, adapt their `intl`: `@plone/controlpanels` exports `translationFromIntl(intl)` for it, and `PlateEditor` still takes an `intl` prop and adapts it itself.
- **Messages** have an id, namespaced by the package (`plate.…`, `controlpanels.…`), and their English text as the default.
  Placeholders use i18next's double braces: `{{count}}`.
  The adapter turns them into react-intl's `{count}`.
- **React escapes what it renders,** so the package should ask i18next not to escape the values too (`interpolation: { escapeValue: false }`), as `@plone/controlpanels` does. Otherwise a `/` in a value shows as `&#x2F;` in Aurora.
- **The translations ship in the package,** as i18next's `common` namespace: {file}`locales/<language>/common.json`, next to the package's `main` file.
  In `@plone/controlpanels`, the English catalog is generated from the code (`pnpm i18n`), and a test checks that the other languages only use known messages, with the same placeholders.

**In Plone Aurora,** the package is a registered add-on: it's a dependency of the app and listed in its {file}`registry.config.ts`, and it default-exports a function that applies its configuration, even if it only returns it.
The registry then merges its catalogs into the app's, and i18next loads them.

**In Volto,** the messages go into Volto's gettext catalogs.
volto-plate's {file}`scripts/plate-i18n.mjs` shows how: it generates a `defineMessages` file with every key of the package, so Volto's i18n extraction adds them to the {file}`.po` files, and fills their empty translations from the package's JSON catalogs.

## Styles

Plone Aurora's Tailwind setup scans the package's source, so Aurora needs nothing else.

Volto has no Tailwind, so the package ships compiled CSS for it.
`@plone/controlpanels` builds {file}`dist/controlpanels.css` with the Tailwind CLI, then a PostCSS step:

- **scopes every rule** to `:where(.plone-controlpanels)`, so it adds no specificity and styles nothing outside the package's screens, Tailwind's reset included,
- **removes the cascade layers**, since layered rules lose to any unlayered rule, like Semantic UI's.

`ControlPanelsScope` renders the scope around the screens, and renders popovers, dialogs and sheets inside it, through React Aria's `UNSAFE_PortalProvider`, so they're styled too.

## Shipping and building

The packages ship their TypeScript source, with no build step, like the other add-ons.
Aurora's Vite compiles them.
Volto's webpack has to compile them too, and their source dependencies, such as `@plone/helpers`: add them to Babel's includes and to the server bundle's allow list in {file}`razzle.config.js`.

## Dependencies on the registry

`@plone/registry` keeps the app's configuration in its module, so an app must have a single copy.
A package that uses it lists it as a peer dependency only, with a range that covers both apps (`^3.0.0 || ^4.0.0-alpha.0`: Volto is on 3, Aurora on 4), and as a workspace devDependency for its own tests.
As a regular dependency, an app on another version would get a second copy for the package, which would read an empty configuration.
React is a peer dependency too, for React 16.8 to 19.
