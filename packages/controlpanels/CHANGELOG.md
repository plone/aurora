# @plone/controlpanels Release Notes

<!-- Do *NOT* add new change log entries to this file.
     You should create a file in the news directory instead.
     For helpful instructions, please see:
     https://6.docs.plone.org/contributing/index.html#contributing-change-log-label
-->

<!-- towncrier release notes start -->

## 1.0.0-alpha.3 (2026-11-25)

### Bugfix

- Find `@content-types` and the site's own type on backends whose site root isn't a `Plone Site`, such as Nick's `Site`: `detectRestApi` reads the site root's type, and `ContentTypesBackend` has it as `siteType`. @sneridagh 

## 1.0.0-alpha.2 (2026-11-22)

### Feature

- The unsaved-changes dot of the content type tabs matches the error dot of the editor's fieldset tabs, and the new Quanta tabs space it. @sneridagh 

## 1.0.0-alpha.1 (2026-11-21)

### Feature

- Add the `@plone/controlpanels` package, with the content types control panel's data model, its driver interface and a mock driver. @sneridagh [#269](https://github.com/plone/aurora/issues/269)
- Add `createRestApiDriver`, the content types driver for plone.restapi, and `detectRestApi`. It uses `@content-types`, `@behaviors` and `@workflows` (plone/plone.restapi#2061) when the backend has them, and `@controlpanels/dexterity-types` otherwise. Every app passes its own `request` function, with its credentials. The payload translations moved here from `@plone/cmsui`. @sneridagh 
- Add the Behaviors tab to a content type's page: the behaviors that add fields as an ordered list, reorderable by drag and drop or with Alt and the arrow keys, the features in their own group, a preview of the edit form, a switch between the variants of a behavior, and a dialog to add behaviors, with their ids and searchable by them, that explains the ones that overlap. `ContentTypesDriverProvider` takes `behaviorMetadata`, which describes behaviors beyond what the backend says, over defaults for the core behaviors. @sneridagh 
- Add the Fields tab to a content type's page: every field of the edit form by fieldset, with the fields from behaviors locked, a side sheet to edit the type's own fields, dialogs to add fields and fieldsets, and reordering by drag and drop or with the keyboard. Drivers now list the field types and have a `fieldsetOrder` capability. @sneridagh 
- Add the Workflow tab to a content type's page: the type's workflow with its states, who can see items in each, and its transitions, and a three-step dialog to change it. The dialog suggests a new state for each current state that keeps who can see the items, shows how many items are in each, warns when items become less visible, and says what changes before anything does. `WorkflowChangeRequest` takes `followDefault`. @sneridagh 
- Add the content type page: tabs with their own URLs, one save for every tab with a save bar and a mark on changed tabs, a dialog before leaving with unsaved changes, and the Settings tab. @sneridagh 
- Add the content types list, with search, an Addable filter and switch, a menu for each type, and dialogs to add, copy and delete types. @sneridagh 
- Change the workflow of several types at once from the type list's selection bar, and the site default workflow from the site defaults strip, with the same three-step dialog as a single type. The mapping step shows one table per current workflow. `ChangeWorkflowDialog` takes `types` and `siteDefault` instead of `type` and `count`. The site defaults strip also shows when the driver only knows the default workflow. @sneridagh 
- Follow the reviewed plone.restapi content types API (plone/plone.restapi#2070, #2090): a type's number of items is `content_count`, the Settings tab has "Show in navigation" instead of "Can be used as a folder's default page", and the Workflow tab says when a type's chain has other workflows, which changing the workflow replaces. The capability and settings field `defaultPage` is now `inNavigation`. @sneridagh 
- Ship `dist/controlpanels.css` for apps without Tailwind, such as Volto: the classes of the screens and of the Quanta components they render, with Tailwind's reset, scoped to `.plone-controlpanels` and without cascade layers. `ControlPanelsScope` sets the scope, and renders popovers, dialogs and sheets inside it. `pnpm build:css` builds it, and releases build it too. @sneridagh 
- The control panels are translated like `@plone/plate`: `ControlPanelsProvider` takes a `t` function in react-i18next's shape instead of `translate`, apps on react-intl pass `translationFromIntl(intl)`, and the messages use `{{placeholder}}`s. The translations ship in `src/locales`, in English, German, Spanish, Italian, Catalan and Brazilian Portuguese, and load in Plone Aurora with the add-on. `pnpm i18n` updates the English catalog from the code. @sneridagh 
- `ContentTypesDriverProvider` takes `stateColors`, the colors of workflow states by state id, and `useStateColor()` returns the color to show a state with. The README explains how a state's color is chosen, and how to set the colors of a new workflow. @sneridagh 

### Bugfix

- Show the rows of the workflow change dialog's mapping step in the order of the current workflow's states, whatever order the driver sends them in. @sneridagh
