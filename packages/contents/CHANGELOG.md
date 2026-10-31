# @plone/contents Release Notes

<!-- Do *NOT* add new change log entries to this file.
     You should create a file in the news directory instead.
     For helpful instructions, please see:
     https://6.docs.plone.org/contributing/index.html#contributing-change-log-label
-->

<!-- towncrier release notes start -->

## 1.0.0-alpha.5 (2026-10-30)

### Bugfix

- Added `data-locale` with the interface language to `<html>`, so the client starts in the language the server detected. @sneridagh [#354](https://github.com/plone/aurora/issues/354)

## 1.0.0-alpha.4 (2026-10-29)

### Breaking

- Renamed the Contents view resource routes from `/@@contents/@@<action>` to `/@@contents/@<action>` (`delete`, `upload`, `rename`, `workflow`, `tags`, `properties`, `order` and `paste`): resources use a single `@`, like the REST API endpoints, and views use `@@`. Update any code that calls the old URLs. @sneridagh 

### Feature

- The Contents view resource routes (`@@contents/@delete`, `@upload`, `@rename`, `@workflow`, `@tags`, `@properties`, `@order` and `@paste`) no longer get the content loaded by the root middleware. @sneridagh 
- The `@plone/components` components are rendered from the component registry with `config.getComponent`, so add-ons can override them. @pnicolli 
- The page size of the Contents view can be set with `config.settings.contentsPageSize`. It defaults to 10, as before. @sneridagh 

### Bugfix

- The Contents view no longer marks every item as expired or scheduled when the backend sends `null` for an unset expiration or effective date, as `plone/nick` does. Reported by @mpalomaki. @sneridagh 

### Internal

- Removed the test, spec, and story `exclude` entries from `tsconfig.json` that never matched any file, documenting that `check:ts` type-checks them. @sneridagh 
- The contents modals import `Heading` from `@plone/quanta`. @sneridagh 
- The contents table uses Quanta's `Pagination`, instead of the one from `@plone/components`. @pnicolli 
- The contents view's popovers use Quanta's `Popover`, `Dialog` and `Checkbox`, and the item actions use React Aria Components' `Button`, instead of the ones from `@plone/components`. @pnicolli 
- The properties modal converts the effective and expiration dates for the Quanta date controls. @sneridagh 
- The upload modal uses Quanta's `Text`, which replaces `DropZoneText`. @sneridagh 
- Updated React Aria Components to 1.22, and moved all React Aria packages and `tailwindcss-react-aria-components` into the pnpm catalog. @sneridagh 

## 1.0.0-alpha.3 (2026-10-03)

### Internal

- Added a visual regression test for the contents listing. @sneridagh [#199](https://github.com/plone/aurora/issues/199)
- Import icons from `@plone/icons`. Import Quanta components from `@plone/quanta`. @pnicolli 
- The `release` scripts now take the GitHub token from `gh auth token` when `GITHUB_TOKEN` is not set, and run `towncrier` with `uvx` instead of `pipx`. @sneridagh 

## 1.0.0-alpha.2 (2026-09-29)

### Feature

- Implemented the Rename, Change state (workflow), Tags, and Properties bulk actions in the folder contents view, replacing the previous placeholder buttons. @nils-pzr 

## 1.0.0-alpha.1 (2026-09-21)

### Internal

- Updated repository metadata and internal planning docs to reference `plone/aurora` instead of `plone/volto`/`Seven`. @sneridagh 

## 1.0.0-alpha.0 (2026-09-05)

### Feature

- Added the `@plone/contents` package with Seven folder contents views, actions, upload, ordering, filtering, and pagination. @pnicolli @giuliaghisini 

### Internal

- Adapted routes to React Router v8's renamed loader/action context fields and `meta()` match shape. @sneridagh 
- Declared the catalog-managed i18next version as a peer dependency to keep react-i18next instances unified. @sneridagh 
- Updated contents route imports and TypeScript app type resolution to use the `@plone/aurora` app alias. @sneridagh
