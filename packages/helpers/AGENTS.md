# AGENTS.md

This file applies only to `packages/helpers` and its subdirectories.

## What This Package Is

- `@plone/helpers` provides **generic, reusable utility functions** for Plone frontend development.
- It is a **framework-agnostic** library — no UI dependencies. React is only allowed in the React bindings listed below.
- It covers URL normalization (`flattenToAppURL`, `isInternalURL`), block helpers, content helpers, and shared primitives.

> [!WARNING]
> This package is experimental. Breaking changes may occur without notice.

## Package Model

- Each concern has its own file: `atoms.ts`, `blocks.ts`, `contents.ts`, `flattenToAppURL.ts`, `isInternalURL.ts`, `languageMap.ts`, `primitives.ts`.
- `form/` is the form layer: per-form state in a Jotai store (`createFormStore.ts`, framework-agnostic), dotted path utilities (`path.ts`), and its React bindings (`react.tsx`: `useFormStore`, `FormProvider`, `useSchemaField`…).
- Everything is re-exported from `src/index.ts`.
- The package is compiled with **tsup**.

## Editing Rules

- **Keep it framework-agnostic.** Do not import React, hooks, or any UI framework, except in the React bindings: `atoms.ts` and `form/react.tsx`. Keep their framework-agnostic logic in separate files.
- Keep functions pure and side-effect-free wherever possible.
- Do not add helpers that are specific to a single consuming package — helpers here must be genuinely reusable.
- Add unit tests for every non-trivial function. Colocate test files alongside their source file (`*.test.ts`).

## Validation

```sh
pnpm --filter @plone/helpers test --run
pnpm --filter @plone/helpers build
```
