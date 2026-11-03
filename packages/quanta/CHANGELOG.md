# @plone/quanta Release Notes

<!-- You should *NOT* be adding new change log entries to this file.
     You should create a file in the news directory instead.
     For helpful instructions, please see:
     https://6.docs.plone.org/volto/developer-guidelines/contributing.html#create-a-pull-request
-->

<!-- towncrier release notes start -->

## 1.0.0-alpha.3 (2026-10-29)

### Breaking

- Rebuilt `MultiSelect` as a controlled component on Quanta's `ComboBox` and `TagGroup`: it takes `value` and `onChange`, and `allowsCustomValue` replaces `creatable`. Removed the unexported `TokenSelect` demo. @sneridagh 
- Updated the collections to React Aria's Tailwind starter API: `SelectSection` and `MenuSection` take `title` and `items`, `ComboBox` takes `selectionMode="multiple"`, and `ListBox`, `ComboBoxSection` and `GridListHeader` are exported. A multiple selection in `Select` shows the selected items on one line. Removed `SelectListBox`, `SelectSectionHeader`, `ComboBoxListBox` and `MenuSectionHeader`. @sneridagh 
- Updated the fields to React Aria's Tailwind starter API: `Checkbox`, `Radio` and `CustomRadio` are built on React Aria's `CheckboxField` and `RadioField`, and take a `description`. `DatePicker` and `DateTimePicker` take and return React Aria's date values instead of ISO strings. `Calendar` takes `visibleDuration`. `CheckboxGroup` moved to its own module. Removed `Field`, `FieldWrapper` and `TextField`'s `minValue`. @sneridagh 
- Updated the navigation components to React Aria's Tailwind starter API: `Tabs` takes its tabs and panels as children instead of a `tabs` prop, and `DropZoneText` is renamed `Text`. Removed the `ToolbarProps` type. @sneridagh 

### Feature

- Added `Pagination`, `ColorSwatch` and `ColorSwatchPicker` to Quanta. @pnicolli 
- Added `TabPanels`, `ToggleButton`, `ToggleButtonGroup` and `ProgressBar`. `Button` shows a spinner when `isPending`, and toggle button groups in a `Toolbar` follow its orientation. @sneridagh 
- Added the `NumberField` control. @sneridagh 
- Added the `Sheet` component, built on React Aria's `Sheet`: a full-height side panel on the left or right, or a sheet from the bottom or top, which can be swiped away on touch devices. @sneridagh 
- Added the `Switch` control, built on React Aria's `SwitchField`. @sneridagh 
- Components use Quanta's palette instead of Tailwind's generic grays, blues, reds, greens and yellows. Most colors shift by a few shades. The most visible change is the selected day in the `Calendar`, now Quanta's sapphire. @sneridagh 
- Renamed the `AlignWidget`, `SizeWidget` and `WidthWidget` controls to `AlignPicker`, `SizePicker` and `WidthPicker`, and exported their props types. The old names are deprecated aliases. @sneridagh 
- Restyled the form controls after the Quanta design: `Checkbox`, `Radio` and `Switch` follow the Figma controls (18 px, thin borders, sapphire when selected, denim labels), fields show the error before the help text, a cobalt focus border, a rose focus border when invalid, a bordered disabled state, a dashed read-only state and a pale blue autofilled state, and `Select` and `ComboBox` use a smaller iron chevron and the 48 px field height. @sneridagh 
- Restyled the overlays after the Quanta design: popovers have a 6 px radius and a light shadow, dropdown rows are 36 px with denim text and a snow hover, menus have sapphire 48 px rows separated by smoke lines, the `Modal` has the dolphin backdrop, `Accordion` uses Quanta colors with 60 px rows, and tags are white pills with a silver outline. @sneridagh 
- Updated the overlays to React Aria's Tailwind starter API: `Dialog` exports React Aria's `Heading`, like the starter. @sneridagh 

### Bugfix

- Fixed the `Accordion` colors, which referred to colors that Quanta doesn't define, the menu's focus outline, the submenu chevron overlapping long labels, and the tag text size. @sneridagh 
- Fixed the read-only style of `TextField` and `TextAreaField`, which never applied, and the invalid style of `Checkbox`, which used a color that doesn't exist. @sneridagh 

### Internal

- Added visual regression tests for every Quanta component, and stories for the Calendar, Separator, ComboBox, Dialog, GridList and Table components and for more Checkbox and RadioGroup states. @sneridagh 
- Removed the `react-aria` dependency, and moved `react-stately` to the development dependencies, since only a story uses it. @sneridagh 
- Removed the test, spec, and story `exclude` entries from `tsconfig.json` that never matched any file, documenting that `check:ts` type-checks them. @sneridagh 
- Removed the unused submenu offset from the `Popover`. @sneridagh 
- Run the app and Quanta visual regression tests one after the other in CI, so the Quanta tests' load doesn't change the app screenshots, and wait for images to be decoded before a screenshot. @sneridagh 
- Updated React Aria Components to 1.22, and moved all React Aria packages and `tailwindcss-react-aria-components` into the pnpm catalog. @sneridagh 

### Documentation

- Pinned React Aria's Tailwind starter at `react-aria-components@1.22.1` as the reference for the Quanta components, with the rules for following it. @sneridagh 

## 1.0.0-alpha.2 (2026-10-06)

### Bugfix

- Fixed the quanta table row drag handle relying on a global CSS reset to drop the basic button styles. @sneridagh [#199](https://github.com/plone/aurora/issues/199)

## 1.0.0-alpha.1 (2026-10-03)

### Feature

- Initial release of `@plone/quanta`, the Quanta design system components previously exported from `@plone/components/quanta`. @pnicolli 

### Documentation

- Updated `docs/how-to-guides/customize-login-screen.md` and `docs/tutorials/add-prisma-database.md` to import from `@plone/quanta`. @pnicolli

  Document that consumers need `@plone/icons/icons.css` and a Tailwind `@source` for `@plone/icons`. @pnicolli
