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

| Component | Starter | Status | Notes |
| --- | --- | --- | --- |
| `Label`, `Description`, `FieldError`, `FieldGroup`, `Input`, `fieldBorderStyles`, `fieldGroupStyles` | `Field.tsx` | `aligned` | |
| `inputStyles`, `TextArea` | none | extra | Used by `TextField` and `TextAreaField`. |
| `TextField` | `TextField.tsx` | `aligned` | |
| `TextAreaField` | none | `extension` | The starter covers multiline text with `TextField`. |
| `Checkbox` | `Checkbox.tsx` | `aligned` | Built on `CheckboxField` + `CheckboxButton`. `className` styles the label. |
| `CheckboxGroup` | `CheckboxGroup.tsx` | `aligned` | |
| `RadioGroup`, `Radio` | `RadioGroup.tsx` | `aligned` | `Radio` is built on `RadioField` + `RadioButton`. |
| `CustomRadio` | none | `extension` | A radio rendered as a toggle button, built on `RadioField` + `RadioButton`. Used by the pickers. |
| `Switch` | `Switch.tsx` | `aligned` | Built on `SwitchField` + `SwitchButton`. |
| `NumberField` | `NumberField.tsx` | `aligned` | |
| `SearchField` | `SearchField.tsx` | `aligned` | The starter's clear button is a `FieldButton`. Quanta uses its own `Button`. |
| `Form` | `Form.tsx` | `aligned` | |
| `DateField` | `DateField.tsx` | `aligned` | |
| `DateInput` | `DateField.tsx` | `aligned` | The starter keeps it in `DateField.tsx`. |
| `TimeField` | `TimeField.tsx` | `aligned` | |
| `Calendar`, `CalendarGridHeader` | `Calendar.tsx` | `aligned` | |
| `DatePicker` | `DatePicker.tsx` | `aligned` | Takes date values, see {ref}`quanta-dates-label`. `resettable` (default `true`) is an extra: it shows a button that clears the value. |
| `DateTimePicker` | none | `extension` | A `DatePicker` with minute granularity, which fills in the current time when you first pick a day. |

## Collections

| Component | Starter | Status | Notes |
| --- | --- | --- | --- |
| `ListBox`, `ListBoxItem`, `DropdownItem`, `DropdownSection`, `itemStyles`, `dropdownItemStyles` | `ListBox.tsx` | `aligned` | |
| `Select`, `SelectItem`, `SelectSection` | `Select.tsx` | `aligned` | `SelectSection` takes `title` and `items`. |
| `SelectItemObject`, optional `children`, `labelClassnames` | none | extra | Without `children`, `Select` renders `SelectItemObject` items by their `label`. Used by the `cmsui` widgets and the `contents` modals. |
| `ComboBox`, `ComboBoxItem`, `ComboBoxSection` | `ComboBox.tsx` | `aligned` | Takes `selectionMode="multiple"`. Shows "No results found" when nothing matches. |
| `GridList`, `GridListItem`, `GridListHeader` | `GridList.tsx` | `aligned` | `GridListItem` also merges a `className`. |
| `Table`, `TableHeader`, `Column`, `TableBody`, `Row`, `Cell` | `Table.tsx` | `Plone-specific` | Keeps the drag column header and width props. `TableFooter` can be added when needed. |
| `TagGroup`, `Tag` | `TagGroup.tsx` | `aligned` | |
| `Menu`, `MenuItem`, `MenuSection`, `MenuSeparator`, `MenuTrigger`, `SubmenuTrigger` | `Menu.tsx` | `aligned` | `MenuSection` takes `title` and `items`. `Menu`, `MenuItem`, `MenuSection` and `MenuSeparator` also merge a `className`. |
| `MultiSelect` | none | `extension` | The starter's `TokenField` is a different component (free text with tokens). |
| `TokenSelect` | none | internal | Not exported. Demo-grade (hard-coded label). Remove, or finish. |

## Overlays

| Component | Starter | Status | Changes needed |
| --- | --- | --- | --- |
| `Popover` | `Popover.tsx` | `aligned` | Remove the unused `SubmenuTrigger` offset logic. |
| `Dialog` | `Dialog.tsx` | `API changes` | Export `Heading`, like the starter. |
| `DialogTrigger` | none | extra | Re-exported from RAC. Used by `cmsui` (ImageWidget, ObjectBrowserTrigger). |
| `Modal` | `Modal.tsx` | `aligned` | None. |
| `Tooltip` | `Tooltip.tsx` | `aligned` | None. |
| `Drawer` | `Sheet.tsx` | replaced | Not on `main` (`feat/quanta-controls`). Quanta adds the starter's `Sheet` instead. See {ref}`quanta-side-panel-label`. |

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

-   Overlays: `AlertDialog`, `Toast` (Plone Aurora's toast lives in `@plone/layout`)
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

(quanta-side-panel-label)=

### Side panel

Quanta's side panel is the starter's `Sheet`, built on React Aria's `Sheet` API, with Quanta's styles.
It replaces the `Drawer` from `feat/quanta-controls`, which was never released.

On desktop, a `Sheet` with `position="right"` works like a drawer: it slides in from the edge, dims the page, keeps the focus inside, and closes on an outside click or {kbd}`Esc`.
On touch devices it can also be swiped away, and it supports snap points and stacked sheets.
`position` also accepts `start` and `end`, which follow the text direction.

The starter styles the side positions as a rounded, inset card 300 pixels wide.
Quanta styles them as a full-height panel, flush with the edge.
`Sheet` needs its own keyframes (`Sheet.css`), which Quanta bundles in its CSS.
