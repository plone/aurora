# AGENTS.md

This file applies only to `packages/blocks` and its subdirectories.

## What This Package Is

- `@plone/blocks` provides the **core content blocks for Plone Aurora**.
- It is **not part of Volto** and not used by it.
- Each block serves two consumers:
  - **Edit components** → consumed by `@plone/plate` (the Plone Aurora block editor, aka Somersault block editor)
  - **View components** → consumed by `@plone/publicui` (the public-facing renderer)

> [!WARNING]
> This package is experimental. Breaking changes may occur without notice.

## Block Structure

Each block lives in its own folder at the package root (e.g., `Video/`, `Image/`, `Teaser/`, `Listing/`):

```
<BlockName>/
  <BlockName>BlockView.tsx   # View variant — used by publicui
  <BlockName>BlockEdit.tsx   # Edit variant — used by plate
  schema.tsx                 # Block schema definition
  index.ts                   # Re-exports
```

- View and Edit components are co-located in the same folder.
- The `index.ts` should export both variants so consumers can import what they need.

## Package Model

- Keep blocks **self-contained**. Avoid cross-block dependencies.
- Blocks receive their data via props; they do not fetch data independently.
- The schema file defines the block's configuration fields for the editor UI.
- Do not add routing, global state, or provider dependencies directly inside block components.

## Editing Rules

- When adding a new block, create the full folder structure: View, Edit, schema, and index.
- Make sure both Edit and View variants are exported from the block's `index.ts`.
- Write tests for non-trivial rendering logic.
- Put block content styles in `styles/content.css` (see Validation below). Keep any other CSS colocated with the component that uses it.

## Validation

```sh
pnpm --filter @plone/blocks test --run
pnpm --filter @plone/blocks check:ts
```

Block content styles live in `styles/content.css`, which the app loads in both the Public UI and the CMSUI inside the `plone-content` cascade layer. Follow the authoring rules in `docs/conceptual-guides/add-on-styles-loader.md`: no CSS Modules, no `@layer`, and selectors inside `:where()`.

Acceptance tests live under `acceptance/tests/` (run with `pnpm acceptance-test`) and visual regression tests under `acceptance/visual/` (run with `pnpm visual-test`). Visual baselines are only generated in CI, through the "Update VRT Screenshots" workflow; never commit locally generated screenshots.
