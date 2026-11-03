# AGENTS.md

This file applies only to `packages/components` and its subdirectories.

## What This Package Is

- `@plone/components` is a thin wrapper layer around `react-aria-components`.
- Components should be usable out of the box in Plone Aurora and in Plone Volto.
- Keep components presentational and lightweight. Avoid adding app-specific behavior, data logic, or i18n machinery here.

## Component Model

- Prefer staying very close to the underlying React Aria Components API.
- Do not reinvent component behavior that RAC already provides.
- Add Plone value mainly through packaging, small ergonomic wrappers, and styling.
- Some components, such as `Breadcrumbs`, are intentionally adapted for Plone Aurora/Volto and REST API use cases. In those cases, the wrapper props and helpers may shape data for that environment, but the underlying RAC behavior should remain intact.
- Even adapted components should still behave like thin proxies: keep forwarding supported props through to the underlying RAC component so upstream RAC documentation and expectations continue to apply.

## Basic Set

- This package holds only the basic flavour: CSS-styled components, one folder per component under `src/components/<ComponentName>/`.
- Basic components are exported from `src/index.ts`.
- Keep tree-shaking in mind when adding exports or shared helpers.
- Do not add Quanta or Tailwind code here; Quanta lives in `@plone/quanta`.

## Styles

- Built CSS lives under `src/styles`.
- Basic component styles live in `src/styles/basic/`, usually one CSS file per component, and are bundled from `src/styles/basic/main.css`.
- Other `src/styles` folders are for shared assets such as static files and fonts.
- When adding or renaming a styled component, make sure the corresponding style entry is wired into the appropriate `main.css`.

## Stories

- Every public component should have a Storybook story.
- Keep stories colocated with the component in the same folder.

## Icons

- Icons, the `Icon` component and the SVGR Vite plugin live in `@plone/icons` (`packages/icons`); import them from there.

## Editing Rules

- Keep changes minimal and package-local.
- Prefer extending existing component folders and patterns over introducing new abstractions.
- If adding a new public component, check all relevant pieces:
  - component file
  - stories
  - styles
  - exports
  - tests when behavior is non-trivial

## Validation

- Prefer targeted checks from this package:
  - `pnpm --filter @plone/components test --run`
  - `pnpm --filter @plone/components lint`
  - `pnpm --filter @plone/components build`
- Run `pnpm --filter @plone/components eslint:fix` after editing component code.
