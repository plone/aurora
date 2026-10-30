# AGENTS.md

This file applies only to `packages/agave` and its subdirectories.

## What This Package Is

- `@plone/agave` is the **example base theme for Plone Aurora**.
- It is a CSS-only theme that consumes design tokens and primitives from `@plone/theming`.
- It is intended as a starting point that end users will most likely **remove and replace** with their own custom theme.
- TypeScript or React code may be added in the future if needed, but this is not planned — keep it CSS-first.

## Package Model

- CSS lives under `styles/`.
  - `content.css` holds the tokens, the skins, the colour modes, the headings and the block styles. The app loads it in both the Public UI and the CMSUI editor (in the `plone-content` layer), so the content looks the same in both. Tokens are declared on `.app-slot` (the Public UI page root) and `.content-area`.
  - Only the Default skin is active. The Nieve skin stays in `content.css`, commented out, as an example: another skin overrides Default from `data-skin` on `<html>`.
  - The page is light, whatever the OS prefers. The colour tokens carry their dark values with `light-dark()`, and `data-mode="dark"` (or the `dark` class) on `<html>` switches the Public UI to them. Nothing sets it yet; keep it that way unless a mode switch is planned. The editor's content stays light in any mode.
  - `publicui.css` imports `@plone/theming` first, then styles the frame: the header, the footer and the core views (event, search, sitemap), in the `custom` layer. It only reads tokens.
- Sizes come from the scales in `content.css`, never literal values: spacing from `--space-3xs` to `--space-4xl` (multiples of `--space`, 1rem), text from `--font-size-xs` to `--font-size-display` (from `--font-size` and `--type-scale`), plus the line height, radius, tracking, control and icon size tokens. Round a new value to the nearest step instead of adding one. The exceptions: the skins' own values (base sizes, colours, shadows, background patterns), query breakpoints (CSS doesn't allow `var()` in them), component dimensions written as whole multiples of `--space` (such as the event panel's `calc(var(--space) * 22)`), and the header height and sticky offset, which live on `:root` in rem because the tokens don't reach it.
- Responsive rules are container queries on the regions `@plone/layout` declares: `@container header`, `footer` and `content` (`#header`, `#footer`, `.content-area`), so each region follows its own width. Settings carried by a token are style queries, such as `@container style(--nav-align: center)`. Media queries are only for device and user preferences (`hover`, `prefers-reduced-motion`).
- The brand color is `--brand`; `--accent` keeps `@plone/theming`'s meaning, a subtle hover fill.
- Import from `@plone/theming` for foundational tokens (colors, typography, spacing). Do not redefine what `@plone/theming` already provides.
- Keep styles scoped and avoid leaking global resets or overrides that other packages would not expect.
- Do not add app-specific logic (routing, data fetching, state management) here.

## Editing Rules

- Keep changes minimal and theme-local.
- When restyling an element, check if `@plone/theming` already provides a token or utility for it before adding new CSS variables.
- If TypeScript or React code ever becomes necessary, discuss it explicitly before adding it — the CSS-only constraint is intentional.

## Validation

This package has no dedicated test or lint script.

For repo-wide CSS linting:

```sh
pnpm stylelint
```
