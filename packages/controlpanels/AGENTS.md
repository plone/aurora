# AGENTS.md

This file applies only to `packages/controlpanels` and its subdirectories.

## What This Package Is

- `@plone/controlpanels` holds the control panels that need their own screens, starting with the content types control panel (plone/aurora#269).
- **The same screens run in Plone Aurora and in Volto, unchanged.** Every rule below follows from that, and `docs/conceptual-guides/packages-for-volto-and-aurora.md` explains the pattern, which `@plone/plate` follows too.
- The generic, schema-driven control panel form stays in `@plone/cmsui`.

> [!WARNING]
> This package is experimental. Breaking changes may occur without notice.

## Package Model

- `src/provider/`: `ControlPanelsProvider` connects the screens to the app: its router (`navigate`, `useHref`, through the react-aria-components `RouterProvider`), its translations (`t`, react-i18next's shape, as in `@plone/plate`) and its notifications (`notify`).
- `src/content-types/`: the content types control panel.
  - `types.ts`: the data model the screens show and edit. It is not a backend payload.
  - `driver.tsx`: the `ContentTypesDriver` interface, its `capabilities`, and `ContentTypesDriverProvider`.
  - `mock/`: `createMockDriver()` and its fixtures, captured from a real site.
  - `workflow/`: pure workflow logic, such as `suggestStateMapping` and `stateColor`.
- Everything public is exported from `src/index.ts`.
- Like the other add-on packages, it ships its TypeScript source and has no build step: the app that uses it (Aurora with Vite, Volto with Babel) compiles it.

## Dependency Rules

- Allowed runtime dependencies: `react`, `react-aria-components`, `react-aria` (its own dependency, for what it doesn't re-export), `@plone/quanta`, `@plone/icons` (Quanta depends on it already), `@plone/helpers`, `@plone/registry`, `jotai`.
- Never import `react-router`, an i18n library (`react-i18next`, `react-intl`), `@plone/client`, `@plone/cmsui`, `@plone/components` or any other framework package.
- `src/dependencies.test.ts` fails when `package.json` or a source file breaks these rules. Update its allow list only with a reason that holds for Volto too.
- Peer dependencies stay at `react` `^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0`.

## Editing Rules

- Components get their data from a driver and their app services from the provider. They never fetch, route or translate by themselves.
- Text goes through `useTranslate()` with messages declared by `defineMessages`, with ids under `controlpanels.`. Placeholders use i18next's double braces: `{{count}}`.
- After adding or changing messages, run `pnpm i18n` to update `src/locales/en/common.json`, and add the other languages' translations when you can.
- Anything a backend may not support sits behind a capability. Hide it or disable it with an explanation when the capability is off, and cover both cases in stories.
- Style with Quanta components and Tailwind classes only. Don't assume a CSS reset: Volto has none of Tailwind's.
- Every new component needs a Storybook story using the mock driver, under `Control panels/…`.
- Add unit tests for pure logic and for the mock driver. Flows across routes are tested with Playwright in the app that wires them (cmsui for Aurora).

## Validation

```sh
pnpm --filter @plone/controlpanels test --run
pnpm --filter @plone/controlpanels check:ts
```
