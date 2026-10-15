# AGENTS.md

This file applies only to `packages/quanta` and its subdirectories.

## What This Package Is

- `@plone/quanta` is the Quanta design system for the Plone Aurora CMS UI: the Quanta React components (controls, such as the `SizePicker`, `AlignPicker` and `WidthPicker` pickers), and the Quanta CSS, typography and fonts. It does not know the widget contract: form widgets and their adapters live in `@plone/cmsui`.
- Components are thin wrappers around `react-aria-components`, styled with Tailwind.
- Keep components presentational and lightweight. Avoid adding app-specific behavior, data logic, or i18n machinery here.

## Dependencies

- **Never import `@plone/components`**, in source, stories, tests or config, and never add it to `package.json`. If something seems to need a basic component, copy the minimal piece into this package or use `react-aria-components` directly.
- Icons come from `@plone/icons`.
- When you add or remove a runtime dependency, update `optimizeDeps.include` in `apps/aurora/vite.config.ts` and run `pnpm check:vite-optimize-deps`.

## Component Model

- Prefer staying very close to the underlying React Aria Components API.
- Do not reinvent component behavior that RAC already provides.
- Keep forwarding supported props through to the underlying RAC component, so upstream RAC documentation and expectations continue to apply.

## React Aria's Tailwind Starter

- The reference is React Aria's Tailwind starter at the tag matching the RAC version: `react-aria-components@1.22.1`, [`starters/tailwind/src`](https://github.com/adobe/react-spectrum/tree/react-aria-components%401.22.1/starters/tailwind/src). Update the tag when RAC is updated.
- A component with a counterpart in the starter has the **same exports and props**. Read the starter's file before adding or changing a component, and don't invent props it doesn't have.
- Keep **Quanta's look**: its styles, markup and tokens. Don't copy the starter's classes or DOM.
- Not a full mirror: add starter components only when something needs them.
- Components without a counterpart are extensions. They live next to the others, and are documented in the Plone docs.
- Plone-specific components (`Breadcrumbs`, `Table`, `Accordion`, `Link`'s `asButton`, `Button`'s variants) keep their API. Change them only when the RAC API forces it.
- Extras (a Quanta-only export or prop on a component that has a starter counterpart) are kept and documented when the monorepo uses them, and removed when it doesn't.
- Date controls take and return RAC date values (`DateValue`). Converting Plone's ISO strings is the widgets' job, in `@plone/cmsui`. Quanta doesn't depend on `@plone/helpers` or any other Plone package except `@plone/icons`.
- The per-component inventory, with the status and the changes each component still needs, is `docs/reference/quanta-components.md`. Update it when a component changes.

## Layout and Naming

- The package is Tailwind-only.
- Everything in this package is Quanta, so files have **no `.quanta` suffix**: `Button.tsx`, `Button.variants.tsx`, `Button.stories.tsx`, `Button.test.tsx`.
- One folder per component under `src/components/<Name>/`, with its stories and tests colocated.
- Shared Tailwind helpers (`focusRing`, `composeTailwindRenderProps`, …) live in `src/utils.ts`.
- Public exports go through `src/index.ts`. Keep tree-shaking in mind when adding exports or shared helpers.

## Styles

- `src/styles/` holds the CSS assets (colors, theme, typography, fonts and the few component styles that aren't Tailwind utilities), bundled from `src/styles/main.css` into `dist/quanta.css`.
- When adding a CSS file, wire it into `src/styles/main.css`.
- Icon base styles come from `@plone/icons/icons.css`; don't redefine `.q.icon` in Quanta.

## Stories

- Every public component should have a Storybook story, colocated with the component.
- Keep story titles under `Quanta/…`.

## Visual Regression Tests

- `acceptance/visual/quanta.test.ts` screenshots every story from the static Storybook build, plus the hover, focus and open states that a story doesn't show by itself (overlays, menus, pickers).
- They are the safety net for API changes: a component's look must not change unless that's the goal of the change. A new story gets a screenshot automatically, so keep stories deterministic (fixed dates, no random data).
- Baselines are generated in CI only (the "Update VRT Screenshots" workflow). The tests don't use the backend or the app, so they run in parallel, in their own `quanta` Playwright project.
- Run them locally:

  ```sh
  pnpm --filter @plone/quanta build-storybook
  pnpm exec playwright test --config=playwright-visual.config.ts --project quanta
  ```

## Editing Rules

- Keep changes minimal and package-local.
- If adding a new public component, check all relevant pieces: component file, stories, styles, exports, and tests when behavior is non-trivial.
- Run `pnpm --filter @plone/quanta eslint:fix` after editing component code. The Tailwind class order is enforced by the lint tooling.

## Validation

```sh
pnpm --filter @plone/quanta build
pnpm --filter @plone/quanta check:ts
pnpm --filter @plone/quanta check:exports
pnpm --filter @plone/quanta test --run
pnpm --filter @plone/quanta eslint:fix
pnpm --filter @plone/quanta lint
pnpm --filter @plone/quanta build-storybook
```
