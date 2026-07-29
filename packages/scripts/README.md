# @plone/scripts package

This package is a library of scripts that are useful to automate certain tasks when developing Volto core or Volto projects.

## i18n

It scans and detects i18n messages from the code and adds them to the i18n machinery.

See https://6.docs.plone.org/volto/development/i18n.html for more information.

This script is installed in the `node_modules/.bin` directory and can be called via `yarn i18n` or directly in the `scripts` `package.json` part.

## Aurora optimize-deps audit

Aurora includes a repository-level audit script at
`packages/scripts/check-vite-optimize-deps.js`.

Run it from the repo root with:

```sh
pnpm check:vite-optimize-deps
```

Use it when you change runtime imports in Aurora workspace packages that feed
the app through Vite:

- `@plone/components`
- `@plone/helpers`
- `@plone/cmsui`
- `@plone/layout`
- `@plone/plate`

The script scans those packages for runtime imports of direct third-party
dependencies and compares them with the explicit entries declared in
`apps/aurora/vite.config.ts` and `packages/*/vite.extend.js`.

If it reports missing entries, add them to the relevant optimize-deps config.
If it reports extra entries, remove them unless they are intentionally kept for
some unresolved import path.
