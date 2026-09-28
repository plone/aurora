# AGENTS.md

This file applies only to `packages/plate` and its subdirectories.

## What This Package Is

- `@plone/plate` is the **block editor for Plone Aurora**, built on [Plate.js](https://platejs.org/).
- It will eventually **replace `@plone/volto-slate`** in the Plone Aurora context.
- It is consumed by `@plone/cmsui` to power the `add` and `edit` routes, and uses Edit components from `@plone/blocks` for individual block types.
- Block migration utilities live under `migrations/`.

> [!WARNING]
> This package is experimental. Breaking changes may occur without notice.

## Package Model

- **Presets** (`config/presets/`) define composed editor configurations for different use cases:
  - `block-editor` — full editing preset for the CMS UI
  - `somersault-editor` / `somersault-renderer` — presets for the Somersault rendering pipeline
  - `block-renderer` — read-only block rendering preset
  - `full` — the most feature-complete preset
- **Components** (`components/`) contain Plate UI elements (nodes, resize handles, etc.) — follow Plate.js conventions for node and leaf components.
- **Migrations** (`migrations/`) handle data transformation from old block formats.
- Storybook is configured under `.storybook/`.

## Editing Rules

- When changing editor behavior, prefer adding or modifying a **preset** rather than changing core rendering logic.
- Follow Plate.js plugin and component conventions when adding new editor features.
- If a block needs both an edit and a view component, the edit component lives in `@plone/blocks`; the renderer preset wires it up here.
- Write migration tests for any data format changes.

## Validation

```sh
pnpm --filter @plone/plate test --run
pnpm --filter @plone/plate check:ts
```

Acceptance and visual regression tests live under `acceptance/`:

- `acceptance/fixtures/` — Plate values for each native block (`native-blocks.ts`), a page factory that creates one small page per test through the REST API (`pages.ts`), editor helpers and clipboard payloads for paste tests.
- `acceptance/tests/` — behaviour tests, run with `pnpm acceptance-test`.
- `acceptance/visual/` — screenshot tests, run with `pnpm visual-test`. They run nightly in CI, not per pull request. Baselines live in the external `plone/aurora-visual-regression` repository and are only generated in CI through the "Update VRT Screenshots" workflow; never commit locally generated screenshots.

Only cover features reachable through Aurora's `somersault-editor` and `somersault-renderer` presets, and keep screenshots to the essentials.

For Storybook:

```sh
pnpm --filter @plone/plate storybook
```
