# AGENTS.md

This file applies only to `packages/theming` and its subdirectories.

## What This Package Is

- `@plone/theming` provides the **CSS foundations for Plone Aurora theming**.
- It defines the core design tokens and primitives that other packages and themes build on:
  - Tailwind integration layer (`styles/tailwind.css`): the Tailwind setup, its preflight reset, and the generic tokens, in the `theme` cascade layer
  - Shared utility classes (`styles/utilities.css`): the `icon-*` sizes the `@plone/icons` `Icon` component uses
  - CSS custom properties for colors (`styles/colors.css`) and core theme variables (`styles/theme.css`), used by the Storybooks of `@plone/tooling` and `@plone/layout` only
  - Simple/base styles (`styles/simple/`)
- It is consumed by `@plone/agave` (the example theme) and can be consumed by any custom theme. A theme imports `styles/tailwind.css` first, then sets the token values.
- It doesn't style elements: there's no typography here. Without a theme, the site looks like unstyled HTML with the correct layout.
- The generic color tokens follow shadcn: `--accent` is a subtle hover fill. A theme's brand color goes in `--brand`, which Tailwind exposes as the `brand` color (`text-brand`, `bg-brand`).
- The Quanta palette and the `@source` entries for `@plone/quanta` and `@plone/icons` stay here because the Public UI still renders Quanta components: the toolbar, and `Link`, `Container` and `Input` in a few visitor-facing views. Their utility classes (`text-quanta-sapphire`…) come from this palette.

> [!WARNING]
> This package is experimental. Breaking changes may occur without notice.

## Package Model

- All theming primitives are exposed as **CSS custom properties** (CSS variables) so they can be overridden at any scope.
- Changes here affect every package and theme that imports from `@plone/theming`.
- The `styles/simple/` folder provides baseline reset and component styles for plain/unstyled contexts.

## Editing Rules

- Changes to token names or values here are **breaking changes** — update all consuming packages accordingly.
- Do not add JavaScript or TypeScript code to this package unless absolutely necessary; keep it CSS-first.
- When adding a new token, add it to the appropriate CSS file and ensure it is available in the Tailwind layer if applicable.

## Validation

This package has no dedicated test script.

For repo-wide CSS linting:

```sh
pnpm stylelint
```
