# AGENTS.md

This file applies only to `packages/test-addon` and its subdirectories.

## What This Package Is

- `@plone/test-addon` is a Plone Aurora add-on that **only the acceptance and visual regression tests load**.
- It registers blocks and fields that the core doesn't ship, so the Playwright tests can exercise widgets and features in a real form.
- It's private and never published.

## Package Model

- `index.ts` registers everything in the configuration.
- Each block has its own folder, such as `ObjectListTest/`, with its schema and view.
- The app loads the add-on only when `PLONE_TEST_ADDON` is set when it's built or started (see `apps/aurora/registry.config.ts`). The acceptance `make` targets set it.

## Editing Rules

- Register blocks as `restricted`, so they never show in the block chooser. Tests create them in the page's data.
- Keep it small: only what a test needs. Don't add features for the product here.
- Name what you add after what it tests, for example `objectListTest`.

## Validation

```sh
pnpm --filter @plone/test-addon exec tsc --noEmit
pnpm acceptance-test
pnpm visual-test
```
