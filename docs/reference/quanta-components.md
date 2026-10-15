---
myst:
  html_meta:
    "description": "Inventory of the @plone/quanta components and how each one relates to React Aria's Tailwind starter"
    "property=og:description": "Inventory of the @plone/quanta components and how each one relates to React Aria's Tailwind starter"
    "property=og:title": "Quanta components"
    "keywords": "Plone Aurora, Quanta, @plone/quanta, React Aria, React Aria Components, Tailwind starter, components"
---

(quanta-components-label)=

# Quanta components

`@plone/quanta` is the Quanta design system for the Plone Aurora CMS UI.
Its components are built on [React Aria Components](https://react-aria.adobe.com/) (RAC), and styled with Tailwind.

This page lists every Quanta component, and how it relates to React Aria's official Tailwind starter.
It's the inventory for aligning Quanta with React Aria 1.22, tracked in [plone/aurora#275](https://github.com/plone/aurora/issues/275).
While that work is in progress, the {guilabel}`Changes needed` column says what each component still needs.

## The reference: React Aria's Tailwind starter

React Aria's docs build their examples on the Tailwind starter.
Quanta follows the starter at the tag matching its RAC version:

-   Version: `react-aria-components@1.22.1`
-   Source: [`starters/tailwind/src`](https://github.com/adobe/react-spectrum/tree/react-aria-components%401.22.1/starters/tailwind/src)

When Quanta updates RAC, compare the starter between the old and the new tag, and apply the API changes to the matching Quanta components.

## Rules

-   **Same API as the starter.**
    A Quanta component that has a counterpart in the starter has the same exports and props.
    Its documentation is React Aria's.
-   **Quanta's look.**
    Quanta keeps its own styles, markup and design tokens.
    Don't copy the starter's class names or DOM.
    The visual regression tests in `packages/quanta/acceptance/visual/` check that the look doesn't change.
-   **Not a full mirror.**
    Quanta doesn't have every starter component.
    Starter components are added when something needs them.
-   **Extensions.**
    A component that has no counterpart in the starter, or isn't covered by React Aria's docs, is an extension.
    Extensions live next to the other components, and are documented in the Plone docs.
-   **Plone-specific components stay as they are.**
    Some components have a Plone-specific API.
    They only change when the RAC API forces it.
-   **Extras.**
    A Quanta-only export or prop that the monorepo uses is kept, and documented as an extra.
    An unused one is removed.

## Status values

`aligned`
:   Same exports and props as the starter.

`API changes`
:   Needs changes to match the starter.

`Plone-specific`
:   Keeps its own API.
    Only changes when the RAC API forces it.

`extension`
:   No counterpart in the starter.

## Fields and dates

RAC 1.18 deprecated `Checkbox`, `Radio` and `Switch` in favor of `CheckboxField` + `CheckboxButton`, `RadioField` + `RadioButton`, and `SwitchField` + `SwitchButton`.
The starter's `Checkbox`, `Radio` and `Switch` are built on the new APIs, and add `description` and `errorMessage` conveniences.
Quanta keeps the RAC `*Field` parts as the reference for hand-written forms.

| Component | Starter | Status | Changes needed |
| --- | --- | --- | --- |
| `Label`, `Description`, `FieldError`, `FieldGroup`, `Input`, `fieldBorderStyles`, `fieldGroupStyles` | `Field.tsx` | `aligned` | None. |
| `inputStyles`, `TextArea` | none | extra | Used by `TextField` and `TextAreaField`. |
| `Field`, `FieldWrapper` | none | extra | Not used in the monorepo. Remove, or document. |
| `TextField` | `TextField.tsx` | `API changes` | Remove the `minValue` prop. |
| `TextAreaField` | none | `extension` | The starter covers multiline text with `TextField`. |
| `Checkbox` | `Checkbox.tsx` | `API changes` | Build on `CheckboxField` + `CheckboxButton`. Add `description` and `errorMessage`. `className` goes to the button. |
| `CheckboxGroup` | `CheckboxGroup.tsx` | `aligned` | Move to its own folder. |
| `RadioGroup` | `RadioGroup.tsx` | `aligned` | None. |
| `Radio` | `RadioGroup.tsx` | `API changes` | Build on `RadioField` + `RadioButton`. Add `description`. Export `RadioProps`. |
| `CustomRadio` | none | `extension` | Same migration as `Radio`. Used by the pickers. |
| `Switch` | `Switch.tsx` | `API changes` | Not on `main` yet (`feat/quanta-controls`). Already on `SwitchField` + `SwitchButton`. `children` required, `description` a string, `className` goes to the button. |
| `NumberField` | `NumberField.tsx` | `aligned` | None. |
| `SearchField` | `SearchField.tsx` | `aligned` | None. The starter's clear button is a `FieldButton`. Quanta keeps its own `Button`. |
| `Form` | `Form.tsx` | `aligned` | None. |
| `DateField` | `DateField.tsx` | `aligned` | None. |
| `DateInput` | `DateField.tsx` | `aligned` | None. The starter keeps it in `DateField.tsx`. |
| `TimeField` | `TimeField.tsx` | `aligned` | Compose `className` on the root, like the starter. |
| `Calendar` | `Calendar.tsx` | `API changes` | Accept `visibleDuration`. `CalendarHeader` isn't used outside Quanta: make it private, or document it. |
| `DatePicker` | `DatePicker.tsx` | `API changes` | Generic `DateValue` API instead of ISO strings, and accept `granularity`. The widgets convert the ISO strings, see {ref}`quanta-dates-label`. |
| `DateTimePicker` | none | `extension` | Takes `DateValue` instead of ISO strings. Keeps the reset button and the current time on first pick. |

Consumers to update:

-   `Checkbox`: `contents` (WorkflowModal, PropertiesModal), `cmsui` (SharingForm, BooleanWidget, ByDayField).
-   `Radio`: `cmsui` (RadioOptionsField).
-   `TextField`: `cmsui` widgets, recurrence fields and the login route.
-   `DatePicker` and `DateTimePicker`: `cmsui` (DateWidget, DateTimeWidget, recurrence UntilEndField), `contents` (PropertiesModal).

## Collections

| Component | Starter | Status | Changes needed |
| --- | --- | --- | --- |
| `ListBox`, `ListBoxItem`, `DropdownItem`, `DropdownSection`, `itemStyles`, `dropdownItemStyles` | `ListBox.tsx` | `API changes` | Export them from the package. `DropdownSectionProps` extends `ListBoxSectionProps`. |
| `Select`, `SelectItem` | `Select.tsx` | `API changes` | `SelectSection` takes `title` and `items`, like the starter. `SelectValue` shows the selected text, so multiple selection works. |
| `SelectItemObject`, optional `children`, `labelClassnames` | none | extra | Keep: `cmsui` widgets and `contents` modals use them. |
| `SelectListBox`, `SelectSectionHeader` | none | extra | Not used outside Quanta. Replaced by `SelectSection`'s `title`: remove. |
| `ComboBox`, `ComboBoxItem` | `ComboBox.tsx` | `API changes` | Add `ComboBoxSection`. Accept `selectionMode="multiple"`, which renders `ComboBoxValue`. |
| `ComboBoxListBox` | none | extra | Not used outside Quanta. Keep its "No results found" empty state inside `ComboBox`, and remove the export. |
| `GridList`, `GridListItem` | `GridList.tsx` | `API changes` | Add `GridListHeader`. Use `composeRenderProps` for item children. Show the checkbox for any selection mode. |
| `Table`, `TableHeader`, `Column`, `TableBody`, `Row`, `Cell` | `Table.tsx` | `Plone-specific` | Keeps the drag column header and width props. `TableFooter` can be added when needed. |
| `TagGroup`, `Tag` | `TagGroup.tsx` | `aligned` | Use `composeRenderProps` for `Tag` children. |
| `Menu`, `MenuItem`, `MenuSeparator`, `MenuTrigger`, `SubmenuTrigger` | `Menu.tsx` | `aligned` | None. |
| `MenuSection` | `Menu.tsx` | `API changes` | Takes `title` and `items`, like the starter. Export `MenuSectionProps`. |
| `MenuSectionHeader` | none | extra | Not used outside Quanta. Replaced by `MenuSection`'s `title`: remove. |
| `MultiSelect` | none | `extension` | The starter's `TokenField` is a different component (free text with tokens). |
| `TokenSelect` | none | internal | Not exported. Demo-grade (hard-coded label). Remove, or finish. |

Across the family, generics drop `extends object` (`<T>` instead of `<T extends object>`), like the starter.

Consumers to update:

-   `Select`: `cmsui` (SelectWidget, QuerystringWidget, recurrence fields), `contents` (WorkflowModal).
-   `ComboBox`: `cmsui` (QuerystringWidget, ArrayWidget).
-   `GridList`: `cmsui` (ObjectBrowserWidgetBody).

## Overlays

| Component | Starter | Status | Changes needed |
| --- | --- | --- | --- |
| `Popover` | `Popover.tsx` | `aligned` | Remove the unused `SubmenuTrigger` offset logic. |
| `Dialog` | `Dialog.tsx` | `API changes` | Export `Heading`, like the starter. |
| `DialogTrigger` | none | extra | Re-exported from RAC. Used by `cmsui` (ImageWidget, ObjectBrowserTrigger). |
| `Modal` | `Modal.tsx` | `aligned` | None. |
| `Tooltip` | `Tooltip.tsx` | `aligned` | None. |
| `Drawer` | `Sheet.tsx` | to decide | Not on `main` yet (`feat/quanta-controls`). See {ref}`quanta-side-panel-label`. |

## Navigation and structure

| Component | Starter | Status | Changes needed |
| --- | --- | --- | --- |
| `Tabs`, `TabList`, `Tab`, `TabPanel` | `Tabs.tsx` | `API changes` | Composition API: remove the `tabs` array prop, add `TabPanels`. Update `cmsui` ContentForm. |
| `Accordion`, `AccordionItem`, `AccordionItemTrigger`, `AccordionPanel` | `Disclosure.tsx`, `DisclosureGroup.tsx` | `Plone-specific` | Keeps its names. |
| `Breadcrumbs`, `Breadcrumb` | `Breadcrumbs.tsx` | `Plone-specific` | Takes Plone items (`@id`, `title`) and a `root` item. |
| `Button` | `Button.tsx` | `Plone-specific` | Keeps all of Quanta's variants. Gets ready for an optional pending spinner. See {ref}`quanta-button-label`. |
| `Link` | `Link.tsx` | `Plone-specific` | Keeps the `asButton` prop. |
| `Toolbar` | `Toolbar.tsx` | `API changes` | Provide `ToggleButtonGroupContext` with the toolbar's orientation, like the starter. |
| `ToggleButton`, `ToggleButtonGroup` | `ToggleButton.tsx`, `ToggleButtonGroup.tsx` | `aligned` | Not on `main` yet (`feat/quanta-controls`). One file per component, like the starter. |
| `ProgressBar` | `ProgressBar.tsx` | `aligned` | Not on `main` yet (`feat/quanta-controls`). `hideValue` is an extra. |
| `Separator` | `Separator.tsx` | `aligned` | None. |
| `DropZone` | `DropZone.tsx` | `API changes` | The starter exports the text part as `Text`. Quanta calls it `DropZoneText`. Used by `contents` (UploadModal). |

## Extensions

These components have no counterpart in the starter.

| Component | What it is | Used by |
| --- | --- | --- |
| `SizePicker`, `AlignPicker`, `WidthPicker` | Block settings pickers, built on `RadioGroup` and `CustomRadio`. | `cmsui` (PickerWidgets) |
| `DateTimePicker` | Date and time picker with a reset button, which fills in the current time on first pick. | `contents` (PropertiesModal), `cmsui` (DateTimeWidget) |
| `TextAreaField` | Multiline text field. | `cmsui` (TextareaWidget) |
| `MultiSelect` | Multiple selection from a list, with tags. | none |
| `Container` | Layout container with width variants. | `contents`, `cmsui` and `publicui` routes |
| `Spinner` | Loading indicator. | none |
| `CustomRadio` | Radio rendered as a toggle button. | the pickers |

The deprecated `SizeWidget`, `AlignWidget` and `WidthWidget` aliases of the pickers aren't used, and can be removed.

## Starter components that Quanta doesn't have

Quanta adds these when something needs them:

-   Overlays: `AlertDialog`, `Sheet`, `Toast` (Plone Aurora's toast lives in `@plone/layout`)
-   Collections: `Tree`, `NavigationTree`, `CommandPalette`, `TokenField`
-   Dates: `RangeCalendar`, `DateRangePicker`
-   Controls: `Meter`, `Slider`, `FieldButton`
-   Color: `ColorArea`, `ColorField`, `ColorPicker`, `ColorSlider`, `ColorSwatch`, `ColorSwatchPicker`, `ColorThumb`, `ColorWheel`

## Decisions

(quanta-button-label)=

### Button

The starter's `Button` has `variant` values `primary` (default), `secondary`, `destructive` and `quiet`.
Quanta's has `neutral` (default), `primary`, `destructive` and `icon`, plus `accent` and `size`.
Quanta keeps all of its variants, because they are its look.

React Aria's `isPending` prop marks a button whose action is in progress, such as a {guilabel}`Save` button while the request runs.
The button ignores presses, stays focusable, and tells screen readers that the action is in progress.
Quanta's `Button` already forwards `isPending` to React Aria, but shows nothing.
The starter shows a spinner over the label.
Quanta's `Button` gets ready to show one, as an optional feature.

(quanta-dates-label)=

### Dates

Quanta's date controls take and return React Aria's date values (`DateValue`), like the starter's, and as React Aria's docs describe.
`@plone/quanta` doesn't know about Plone's data formats.

Plone's content API stores dates as ISO strings: `YYYY-MM-DD` for dates, and UTC date-times.
The widgets in `@plone/cmsui` convert them to date values and back, and decide the time zone policy: store UTC, show the browser's local time.
The conversion helpers live in `@plone/cmsui`, next to the date widgets, and `@plone/contents` uses them too.

## Open decisions

(quanta-side-panel-label)=

### Side panel

`Drawer` (from `feat/quanta-controls`) is built on `ModalOverlay` and `Modal`, slides in from the right or left, and closes on an outside click or {kbd}`Esc`.
The starter's `Sheet` is built on RAC's newer `Sheet` API: it opens from any edge or the center, can be swiped or dragged to dismiss, has snap points, and stacks.
It needs its own CSS file.
Which one Quanta uses is decided in [plone/aurora#275](https://github.com/plone/aurora/issues/275).
