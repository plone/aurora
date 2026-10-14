---
myst:
  html_meta:
    "description": "How to instantiate the ObjectBrowser widget in Plone Aurora, both through a schema and programmatically, and which options it accepts."
    "property=og:description": "How to instantiate the ObjectBrowser widget in Plone Aurora, both through a schema and programmatically, and which options it accepts."
    "property=og:title": "Use the ObjectBrowser widget"
    "keywords": "Plone Aurora, Plone, frontend, React, ObjectBrowser, widget, content selection"
---

# Use the ObjectBrowser widget

This guide shows you how to instantiate the ObjectBrowser widget in Plone Aurora, both from a schema and from a custom React component, and which options the widget accepts.

The ObjectBrowser widget lets you pick one or more existing pieces of content from the site through a side-panel modal.
It returns the picked items as a filtered list of search-result objects so you only see the fields you asked for.

`@plone/cmsui` registers the same widget under three registry entries.

`widget` key `object_browser`
:   The primary entry.
    Use this when you declare the widget in a Plone schema field.

`factory` key `Relation List`
:   The fallback for the Volto-legacy widget name.
    A schema that arrives from a Volto-era export keeps working without further changes.

`vocabulary` key `plone.app.vocabularies.Catalog`
:   The catalog vocabulary fallback.
    Any field whose vocabulary is the catalog falls back to the ObjectBrowser.

The widget reads the current content id from the route loader and uses it as the initial browsing path.
This means the widget only works inside an Aurora edit route or another route that exposes the same loader data.


## Use the widget from a schema

The typical path is a schema field that sets `widget: 'object_browser'`.
The Plone form pipeline resolves the registry entry and renders the widget for you.

```ts
// packages/blocks/Teaser/schema.tsx
href: {
  title: 'Target',
  widget: 'object_browser',
  mode: 'single',
  selectedItemAttrs: [
    '@id',
    'Title',
    'title',
    'Description',
    'description',
    'head_title',
    'hasPreviewImage',
    'image_field',
    'image_scales',
    '@type',
  ],
  allowExternals: true,
},
```

Two more real schema fields in the Aurora monorepo show the same pattern with different options.

```ts
// packages/blocks/Teaser/schema.tsx
preview_image: {
  title: 'Image override',
  widget: 'object_browser',
  mode: 'image',
  allowExternals: true,
  selectedItemAttrs: ['@id', 'image_field', 'image_scales'],
},
```

```ts
// packages/blocks/Image/schema.tsx
href: {
  title: 'Link to',
  widget: 'object_browser',
  mode: 'link',
  selectedItemAttrs: ['Title', 'Description', 'hasPreviewImage'],
  allowExternals: true,
},
```

The schema controls every aspect of the picker.
The component itself reads its props from the schema field at render time.


## Use the widget programmatically

When you render the widget outside of a schema field, pull it from the registry and pass props directly.
Use this path for placeholder UIs or for custom edit components that need to drive the selection themselves.

```tsx
import { useCallback } from 'react';
import config from '@plone/registry';

function MyBlockEdit(props) {
  const { data, setBlock } = props;
  const ObjectBrowserWidget = config.getWidget('object_browser');

  const onTargetChange = useCallback(
    (selectedItems) => {
      const target = selectedItems?.[0];
      if (!target) {
        setBlock({ ...data, href: undefined });
        return;
      }
      setBlock({ ...data, href: [target] });
    },
    [data, setBlock],
  );

  if (!ObjectBrowserWidget) return null;

  return (
    <ObjectBrowserWidget
      mode="single"
      onChange={onTargetChange}
      selectedItemAttrs={[
        '@id',
        '@type',
        'title',
        'description',
        'image_field',
        'image_scales',
      ]}
    />
  );
}
```

Read the widget from the registry instead of importing the component module directly.
The registry lookup keeps your component decoupled from the CMSUI package and respects any later widget overrides an add-on may install.


## Widget options

The following options are the ones a consumer normally sets.

`mode`
:   Cardinality of the selection.
    The runtime type is `'single' | 'multiple'` and the default is `'multiple'`.
    Schemas in the monorepo also use the semantic values `'image'` and `'link'` to signal intent to upstream form code.
    The widget itself treats any value other than `'single'` as multi-select.

`selectedItemAttrs`
:   Array of field names to keep from each picked search result.
    Anything outside this list is dropped before `onChange` fires.
    The default is `['@id', 'title', 'description', '@type', 'UID']`.
    Request `'title'`, `'Title'`, or both depending on which field name your data layer produces.

`onChange`
:   Callback that receives the filtered selection.
    The argument is an array of partial search-result objects, even in `'single'` mode.
    Treat `selectedItems[0]` as the chosen item when you set `mode: 'single'`.

`defaultValue`
:   Pre-selected items as an array of search-result objects.
    Used only on the first render.
    Updates to this prop after mount do not change the selection.

`widgetOptions.pattern_options`
:   Constraints passed to the modal.
    The supported keys are `maximumSelectionSize`, `selectableTypes`, `basePath`, and `currentPath`.

`initialPath`
:   Starting folder for the modal.
    Defaults to the current content id from the route loader.

`allowExternals`
:   Set on the schema field when external URLs should be selectable.
    The widget itself does not consume this prop directly, but upstream form code uses it to relax type validation.

For the full prop type, refer to `ObjectBrowserWidgetProps` in `packages/cmsui/components/ObjectBrowserWidget/ObjectBrowserWidget.tsx`.


## Common pitfalls

The widget calls `useLoaderData` to read the current content id.
Mount it inside an Aurora edit route or another route that exposes the same loader data.
Outside that context the widget throws at render time.

`mode` is typed as `'single' | 'multiple'`.
The strings `'image'` and `'link'` are accepted but the widget runtime treats them like `'multiple'`.
Use them only when an upstream form schema honors the semantic meaning.

`selectedItemAttrs` filters silently.
If you ask for a field that the picked item does not have, the widget omits the field from the callback payload without a warning.
Request both lowercase and capitalized field names (`'title'` and `'Title'`) when the backend may return either form.

`defaultValue` initializes the selection once.
Changing the value after mount does not move the selection.
Use a `key` prop on the widget to force a remount when you need to swap the initial state.

For how the registry resolves widget lookups, refer to {doc}`access-registry`.
For the wider component registration model, refer to {doc}`register-and-retrieve-components`.
