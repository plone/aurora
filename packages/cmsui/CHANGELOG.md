# @plone/cmsui Release Notes

<!-- Do *NOT* add new change log entries to this file.
     Instead create a file in the news directory.
     For helpful instructions, see:
     https://6.docs.plone.org/contributing/index.html#change-log-entry
-->

<!-- towncrier release notes start -->

## 1.0.0-alpha.14 (2026-10-30)

### Feature

- Added the password reset flow at `/passwordreset`, the URL Plone's reset email links to: request a reset link, then set a new password with the token. @InteraktivPreuss [#48](https://github.com/plone/aurora/issues/48)

## 1.0.0-alpha.13 (2026-10-29)

### Breaking

- All schema-driven forms render their fields through the new `SchemaFieldsets` component and the `field.SchemaField` field component (`field.Quanta` is kept as a deprecated alias). Widgets now receive the widget contract built from the field schema: `invalid` and a joined `errorMessage` instead of `error`, the schema `default` as `defaultValue` instead of the current value, the raw schema as `schema`, and no forced placeholder. Schema keys the form understands, such as `type`, `title` and `factory`, are no longer passed as widget props; any other schema key is still passed as a widget option. @sneridagh 
- The content form, the control panels and the block settings now keep their values in a form store from `@plone/helpers` (`useFormStore`, `FormProvider`) instead of TanStack Form plus a Jotai atom. Removed `useAppForm`, the `formAtom` registry utility and `routes/atoms` (`formAtom`, `blockAtomFamily`, `useFormFieldValue`): read and write the current form with `useFormContext`, `useFieldValue` and `useSetFieldValue` from `@plone/helpers` instead. The settings sidebar toggle and the sidebar now share the same state. @sneridagh 

### Feature

- Passed `onBlur`, normalized validation errors (`errors` and `errorMessage`) and the caller's `label` to form widgets, and typed `BooleanWidget` with the shared `FormWidgetProps`. @sneridagh [#97](https://github.com/plone/aurora/issues/97)
- Add content history, URL management, links and references, rules, and translation management routes for the toolbar More menu. @sneridagh 
- Add personal information and language preference pages and show personal tools outside content editing. @sneridagh 
- Added the `@blocks-schema` endpoint, which describes the elements and blocks to build a page with, with their docs, variations and schemas, as JSON or Markdown, for authenticated users and agents. @sneridagh 
- Added the `TextareaWidget` (registered for `textarea`, e.g. the summary), `DateWidget` (registered for `date`, an ISO date string) and the `align`, `size` and `width` widget adapters around the Quanta pickers. All of them follow the widget contract, and show the required and invalid state. @sneridagh 
- Added the core widgets for the fields with choices or a vocabulary (`SelectWidget`, now the choices widget), lists (`ArrayWidget`), numbers (`NumberWidget`), files (`FileWidget`), email addresses, passwords, and URLs, and the `@vocabulary` resource route that loads the terms of a vocabulary. A widget registered for a vocabulary now takes precedence over the choices widget. @sneridagh 
- Control panels can now be saved. @sneridagh 
- Schema-driven forms validate their fields. Required fields must not be empty, and the validators registered as `validator` utilities run on the fields they match (by `fieldType`, `widget`, `format`, `behaviorName` + `fieldName`, or `blockType` + `fieldName`), so add-ons can plug in their own. Ported the Volto validators (lengths, patterns, email, URL, numbers, list sizes, unique items, event date range). An invalid save shows the errors on their fields and focuses the first one; validation errors returned by the server are shown on their fields too. The default widget and the date and time widget are now adapters (`TextWidget`, `DateTimeWidget`) that show the required and invalid state. @sneridagh 
- The `@plone/components` components are rendered from the component registry with `config.getComponent`, so add-ons can override them. @pnicolli 
- The `@search`, `@breadcrumbs`, `@objectBrowserWidget`, `@queryStringOptions` and `@createContent` resource routes no longer get the content loaded by the root middleware, so each object browser navigation makes two backend requests instead of five. @sneridagh 
- The widget registry checks registered widgets against the widget contract at compile time (`@plone/cmsui` declares `FormWidgetProps` in `WidgetPropsMap`). Added the `describeWidgetContract` test helper (`@plone/cmsui/testing/widgetContract`), which every core widget runs. `ObjectBrowserWidget` is typed with the widget contract. @sneridagh 
- Widgets learn where the form is from the new `useWidgetContext` (`mode`, `path`, `containerPath`), provided by the content form, the control panels and, through the content form, the block settings, instead of reading the edit route's data or the URL. The object browser follows its field's value, the recurrence widget reads its own `value`, and the image widget can store the picked image's details in sibling fields with the `extraFields` widget option. The object browser listing returns no items, instead of an error page, for a path the API rejects. @sneridagh 

### Bugfix

- Fixed the add form of an Image (and of any type with an image field) crashing on its Content tab: the image widget guessed its location from the URL, and asked the object browser for `/@@add`. @sneridagh [#163](https://github.com/plone/aurora/issues/163)
- Fixed control panels looping forever or showing stale values when opening a second panel, by giving each form its own store and remounting the add and edit forms per item. @sneridagh [#244](https://github.com/plone/aurora/issues/244)
- Cleared the `ObjectBrowserWidgetBody` focus timeout when the component unmounts. @sneridagh 
- Fixed boolean fields not showing their label and value by adding a `BooleanWidget` adapter for the Quanta `Checkbox`. @sneridagh 
- Fixed the back and save toolbar buttons in the control panel routes, which did nothing when pressed. @sneridagh 
- Fixed the block editor re-rendering on every keystroke, and made the link toolbar and the recurrence widget subscribe only to the form fields they read. @sneridagh 
- Fixed the file and image fields, such as the image of an Image or the lead image of a News Item: they now upload the file with `FileWidget`, instead of storing an image URL that the content API cannot save. @sneridagh 
- Fixed the login form so you can sign in again after a failed attempt without reloading the page. @sneridagh 
- Fixed the object browser failing for a folder that does not exist: it now shows an empty listing. @sneridagh 
- Fixed the recurrence modal crashing the edit form when the event ends on days 1 to 9 of a month, because the default "until" date was not a valid ISO date. @sneridagh 
- Fixed widget resolution: each lookup step now only searches its own category, and an unknown `widget` name no longer stops the lookup before choices, vocabulary, factory and type. @sneridagh 
- Registered the `@querystringSearch` route, so the Querystring widget results preview no longer gets a 404. @sneridagh 
- The login action returns the editor to the page the login link was pressed on (the `return_url` the header's login link sends) instead of always to the site root. A `return_url` that is not a path on this site falls back to the site root. @mpalomaki 
- The query string widget's "Reverse order" toggle uses Quanta's `Switch`, instead of the one from `@plone/components`. @sneridagh 

### Internal

- Moved the `SidebarPlugin` and `LinkKit` editor plugins to `config/plate-editor.ts`, so they reach the page editor through the add-on modules loader. @sneridagh 
- Moved the recurrence modal's form to the form store from `@plone/helpers`, and removed the `@tanstack/react-form` dependency. @sneridagh 
- Removed the test, spec, and story `exclude` entries from `tsconfig.json` that never matched any file, documenting that `check:ts` type-checks them. @sneridagh 
- The CMS UI Storybook translates the components' texts in English, instead of showing the translation keys. @sneridagh 
- The CMS UI layout links the `/@layers.css` stylesheet, and the object browser resets its fetcher through `/@reset-fetcher`, following the resource route naming convention. @sneridagh 
- The CMS UI styles import the Quanta palette from `@plone/quanta`, instead of getting it from `@plone/components`' basic theme. @pnicolli 
- The content form uses the composition API of Quanta's `Tabs`. @sneridagh 
- The date widgets convert Plone's ISO strings to the date values of the Quanta date controls, with the new helpers in `helpers/dates`. Removed the `minValue` prop from the recurrence interval and day of the month fields, which had no effect. @sneridagh 
- The object browser's modal uses React Aria Components' `Modal` directly, instead of the one from `@plone/components`. @pnicolli 
- Updated React Aria Components to 1.22, and moved all React Aria packages and `tailwindcss-react-aria-components` into the pnpm catalog. @sneridagh 
- Wait for hydration in the sharing acceptance tests that toggle a checkbox, so they no longer fail against the dev frontend. @sneridagh 
- `ArrayWidget` uses Quanta's `MultiSelect`. @sneridagh 

### Documentation

- Documented how to convert Plone's ISO dates and date-times to React Aria date values and back, with the date helpers. @sneridagh 

## 1.0.0-alpha.12 (2026-10-06)

### Breaking

- Removed the `cmsui` cascade layer. Tailwind is now loaded with a plain import, so its reset lands in `base`, its theme variables in `theme` and its utilities in `utilities`. Add-ons that targeted the `cmsui` layer must move their styles to one of the declared layers. @sneridagh [#199](https://github.com/plone/aurora/issues/199)

### Feature

- Added the `content-area` class to the block editor, so themes' content tokens declared on `.content-area` also apply to the blocks in the editor. @sneridagh [#199](https://github.com/plone/aurora/issues/199)

## 1.0.0-alpha.11 (2026-10-03)

### Internal

- Added visual regression tests for the CMS chrome: login, add and edit forms, block settings sidebar, sharing and control panels. @sneridagh [#199](https://github.com/plone/aurora/issues/199)
- Import icons from `@plone/icons`. Import Quanta components from `@plone/quanta`. @pnicolli
  Scan `@plone/icons` for Tailwind classes, so every icon size utility is generated. @pnicolli
  Load the base icon styles from `@plone/icons`. @pnicolli 
- The `release` scripts now take the GitHub token from `gh auth token` when `GITHUB_TOKEN` is not set, and run `towncrier` with `uvx` instead of `pipx`. @sneridagh 

## 1.0.0-alpha.10 (2026-10-01)

### Feature

- Passed the `react-i18next` `t` and current language to the Plate block editor for its translations. @sneridagh 

## 1.0.0-alpha.9 (2026-09-29)

### Internal

- Covered Heading 2 to Heading 6 in the block width acceptance test for headings created with markdown shortcuts. @sneridagh 

## 1.0.0-alpha.8 (2026-09-29)

### Feature

- Added the `@@sharing` route to manage local roles: searchable user/group listing, editable role checkboxes and inherit toggle. @jmevissen [#29](https://github.com/plone/aurora/issues/29)

### Bugfix

- Fixed editing an existing link from the link toolbar (Browse or Edit link search) so it keeps the link text and only updates its target. @sneridagh 

### Internal

- Added acceptance test coverage for Maps block. @cihanandac 
- Upgraded `platejs`, `@platejs/floating`, and `@platejs/link` to 52.x to align with `@plone/plate`. @sneridagh 
- Upgraded `platejs`, `@platejs/floating`, and `@platejs/link` to 53.x and configured link autolink and markdown `inputRules`. Added acceptance tests for markdown shortcuts and blockquotes. @sneridagh 

## 1.0.0-alpha.7 (2026-09-21)

### Bugfix

- Fixed aurora version check in VersionOverview. @sneridagh 

### Internal

- Updated package repository metadata and towncrier issue links from `plone/volto` to `plone/aurora`. @sneridagh 

## 1.0.0-alpha.6 (2026-09-16)

### Feature

- Block schema fields can now declare an `onChangeSideEffects(value, nextData)` function to patch other fields when they change; the block settings form applies these patches centrally. @sneridagh @TimoBroeskamp 

### Bugfix

- The image widget now forwards `image_field` and `image_scales` from the object browser selection, so image blocks can render responsive image scales. @sneridagh @TimoBroeskamp 

## 1.0.0-alpha.5 (2026-09-05)

### Feature

- Switched login page from Volto style to Plone style.
  Added option to display site logo in login page. @arybakov05 [#24](https://github.com/plone/volto/issues/24)

### Internal

- Adapted routes to React Router v8's renamed loader/action context fields and `meta()` match shape. @sneridagh 
- Added `vite.extend.js` and a dependency audit path to pre-bundle CMS UI runtime dependencies, reducing dev server startup reloads. @arybakov05 
- Declared the catalog-managed i18next version as a peer dependency to keep react-i18next instances unified. @sneridagh 
- Drop the duplicated `LegacyLinkPlugin` from the BlockEditor link kit; legacy Slate fragments pasted from a legacy volto-slate editor are now normalized by `@plone/plate`'s paste boundary instead. @sneridagh 

## 1.0.0-alpha.4 (2026-07-02)

### Breaking

- Refactored the `Content` type to properly match the basic Plone types and allow TypeScript to narrow this type automatically. @pnicolli 

### Feature

- Added German translations. @arybakov05 [#6653](https://github.com/plone/volto/issues/6653)
- Implement login view according to Volto Quanta UI. @arybakov05 [#6656](https://github.com/plone/volto/issues/6656)
- Added querystringWidget for seven @nileshgulia1 [#8007](https://github.com/plone/volto/issues/8007)
- Integrate links with ObjectBrowser. @sneridagh [#8246](https://github.com/plone/volto/issues/8246)
- Added recurrence widget. @sabrina-bongiovanni 

### Bugfix

- Renamed `quanta-lemmon` color to `quanta-lemon`. @arybakov05 [#6656](https://github.com/plone/volto/issues/6656)
- Fix several issues in the Object Browser widget: single selection mode now behaves correctly, clicking a non-folder item no longer attempts navigation, the maximum selection limit is ignored in single mode, and the API for specifying which item attributes to return has been renamed for consistency across the codebase. @iFlameing 
- Fix the sidebar to take 100% vertical space. @frapell 
- Fix toolbar cancel button navigating to site root instead of current content page. @iFlameing 
- Fixed Somersault editor sidebar state when navigating registry-backed Plone blocks and switching edited content. @sneridagh 

### Internal

- Unify Makefile files across the packages. @ionlizarazu 
- Update to storybook 10. @sneridagh 
- Updated CMS UI route imports and typecheck setup to use the `@plone/aurora` app alias. @sneridagh 
- Updated the CMS UI layout loader to read content and locale from route context. @pnicolli 

## 1.0.0-alpha.3 (2026-05-07)

### Bugfix

- Fixed flakey tests. @sneridagh [#8160](https://github.com/plone/volto/issues/8160)

### Internal

- Added AGENTS.md file. @pnicolli 
- Added acceptance coverage for add-view title placeholder alignment and fast title typing to guard the somersault title block sync behavior. 
- Aligned CMSUI's local TypeScript project and test typing setup with the monorepo-wide typecheck cleanup. 
- Moved `tailwindcss-react-aria-components` into CMSUI runtime dependencies so published installs include the Tailwind React Aria plugin they use. @sneridagh 
- Switched CMSUI's local `@testing-library/jest-dom` dev dependency to the shared catalog entry during the monorepo dependency cleanup. 

## 1.0.0-alpha.2 (2026-04-16)

### Breaking

- Removed Cypress support.
  Added Playwright support. Move all existing Cypress tests to Playwright. @sneridagh [#7827](https://github.com/plone/volto/issues/7827)
- Remove resident TextField in CMSUI (former quanta one), use @plone/components one instead. @sneridagh [#8015](https://github.com/plone/volto/issues/8015)
- Refactored and re-thinked blockWidth feature. @sneridagh [#8053](https://github.com/plone/volto/issues/8053)
- Fixed inconsistent use of username argument instead of login in the login API client. @sneridagh [#8112](https://github.com/plone/volto/issues/8112)

### Feature

- Added the left toolbar @pnicolli [#6649](https://github.com/plone/volto/issues/6649)
- Added blocks editor layout with tabs @pnicolli [#7355](https://github.com/plone/volto/issues/7355)
- Somersault editor support. @sneridagh [#7921](https://github.com/plone/volto/issues/7921)
- Refactored runtime migrations to match the somersault editor, reorganize server config files. Fixed tests. @sneridagh [#8021](https://github.com/plone/volto/issues/8021)
- Add an always shown placeholder for the title if empty. @sneridagh [#8057](https://github.com/plone/volto/issues/8057)
- Moved the initialize client to the middleware from the config. @sneridagh [#8108](https://github.com/plone/volto/issues/8108)
- Added `@@add` view @pnicolli 
- Moved basic data fetching to a middleware to allow all loaders and actions to use it @pnicolli 
- Set the cookie expiration date equal to the token expiration date after login @pnicolli 

### Bugfix

- Fixed hydration problems with the `@@edit` view. @sneridagh [#8018](https://github.com/plone/volto/issues/8018)
- Fixed SOMERSAULT_KEY constant, it is centralized now. @sneridagh [#8078](https://github.com/plone/volto/issues/8078)
- Normalize client login arguments to follow all non-get argument shape, nesting them under a data argument. @sneridagh [#8111](https://github.com/plone/volto/issues/8111)

### Internal

- Adapt CMSUI routes to the updated `@plone/client` path argument names for control panel and type loading. @sneridagh 
- Updated packages configuration for vite 8. @pnicolli 

## 1.0.0-alpha.1 (2025-12-23)

### Feature

- Added `--color-brand` since it's used by some libraries (platejs). @sneridagh [#7393](https://github.com/plone/volto/issues/7393)
- Renamed main.css -> publicui.css for placing the publicui CSS in add-ons. @sneridagh [#7426](https://github.com/plone/volto/issues/7426)
- Added ESlint Tailwind plugin for prettifying and wrapping up the classNames in components.
  Amended components classNames by applying the plugin. @sneridagh [#7434](https://github.com/plone/volto/issues/7434)
- Blocks helpers (move up/move down/delete) preliminary styled, wired and working. @sneridagh [#7549](https://github.com/plone/volto/issues/7549)

### Bugfix

- Get `/layers.css` always from the root. @sneridagh [#7490](https://github.com/plone/volto/issues/7490)

### Internal

- Remove unused imports present, due to missing rule in ESlint. @sneridagh [#7395.1](https://github.com/plone/volto/issues/7395.1)
- Fixed unused vars linting rule. Fixed all code that violated this rule. @sneridagh [#7395.2](https://github.com/plone/volto/issues/7395.2)
- Linting for remaining TW classNames under callees due to missconfiguration. @sneridagh [#7467](https://github.com/plone/volto/issues/7467)
- Added basic story for `ObjectBrowserWidget`. @sneridagh [#7469](https://github.com/plone/volto/issues/7469)
- Use a single folder for autogenerated files. @pnicolli 

## 1.0.0-alpha.0 (2025-09-29)

### Feature

- Add controlpanel overview and schema driven control panels. @ksuess [#6657](https://github.com/plone/volto/issues/6657)
- Initial implementation of `@plone/cmsui`. @sneridagh [#6797](https://github.com/plone/volto/issues/6797)
- Added i18n support for projects and add-ons @pnicolli [#6866](https://github.com/plone/volto/issues/6866)
- Updated root loader usage and removed the index route since it is now in the `@plone/publicui` add-on @pnicolli [#6896](https://github.com/plone/volto/issues/6896)
- Unified the `quanta` app into the `seven` app. @pnicolli [#6902](https://github.com/plone/volto/issues/6902)
- Added login and a basic edit form @pnicolli [#6906](https://github.com/plone/volto/issues/6906)
- Better route definition, add common layout in @plone/cmsui routes. @sneridagh [#6908](https://github.com/plone/volto/issues/6908)
- Modify Cypress tests to use a centralized configuration in `@plone/tooling`. @sneridagh [#6944](https://github.com/plone/volto/issues/6944)
- Added logout route. @pnicolli [#6972](https://github.com/plone/volto/issues/6972)
- Added Storybook CMSUI. @sneridagh [#6977](https://github.com/plone/volto/issues/6977)
- Added Quanta TextField component. @sneridagh [#6977](https://github.com/plone/volto/issues/6977)
- Added Quanta styling to login route. @sneridagh [#6977](https://github.com/plone/volto/issues/6977)
- Initial implementation of the edit form.
  It uses Tanstack Form as form library.
  Added the `Field` component used when generating forms from schemas.
  Used `jotai` for keeping a global form value and a way to surgically update the global form values. @sneridagh [#6999](https://github.com/plone/volto/issues/6999)
- Use `useFetcher` for sending the full form as JSON. @sneridagh [#7118](https://github.com/plone/volto/issues/7118)
- Add DateTimePicker and DateField to widget configuration. @rboixaderg [#7131](https://github.com/plone/volto/issues/7131)
- Update widget registration and getting widgets from config with new methods. @deodorhunter [#7141](https://github.com/plone/volto/issues/7141)
- Added a @search route as a helper for widgets. @pnicolli [#7143](https://github.com/plone/volto/issues/7143)
- Added SizeWidget to widget configuration. @rboixaderg [#7150](https://github.com/plone/volto/issues/7150)
- Added object browser widget. @deodorhunter [#7201](https://github.com/plone/volto/issues/7201)
- Separated publicui and cmsui styles. @pnicolli [#7225](https://github.com/plone/volto/issues/7225)
- First wireframe implementation of the Block Editor, focusing on performance. @sneridagh [#7228](https://github.com/plone/volto/issues/7228)
- Register widgets using `registerWidget`. @deodorhunter @sneridagh [#7257](https://github.com/plone/volto/issues/7257)
- Updated widget config registration to reflect new API. @deodorhunter [#7334](https://github.com/plone/volto/issues/7334)
- Improved block editor, support for `@plone/plate`. @sneridagh [#7346](https://github.com/plone/volto/issues/7346)

### Bugfix

- Correct size of the button in login form. @sneridagh [#7040](https://github.com/plone/volto/issues/7040)
- unify and fix the sidebar collapse functionality. @ionlizarazu [#7126](https://github.com/plone/volto/issues/7126)
- Bring back missing toolbar-top. @sneridagh [#7298](https://github.com/plone/volto/issues/7298)
- Fixed the load of the default layers ensuring they are on top, using a React 19 managed `<link>`. @sneridagh [#7365](https://github.com/plone/volto/issues/7365)

### Internal

- Unify Tailwind versions. @sneridagh [#6899](https://github.com/plone/volto/issues/6899)
- Added vitest config to not fail if no test is present. @sneridagh [#6916](https://github.com/plone/volto/issues/6916)
- Moved auth helpers to the react-router package. @pnicolli [#7134](https://github.com/plone/volto/issues/7134)
- Adapt import to the rearrangement of the @plone/components package structure. @sneridagh [#7185](https://github.com/plone/volto/issues/7185)
- Upgrade to Storybook 9. @sneridagh [#7371](https://github.com/plone/volto/issues/7371)
- Remove circular dependency on layout<->blocks. @sneridagh [#7372](https://github.com/plone/volto/issues/7372)
- Adjust peer dependencies and engine. @sneridagh

## 1.0.0 (unreleased)
