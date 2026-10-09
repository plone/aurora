---
myst:
  html_meta:
    "description": "The core widgets of Plone Aurora's forms: what they are registered for, the value they read and write, and their widget options"
    "property=og:description": "The core widgets of Plone Aurora's forms: what they are registered for, the value they read and write, and their widget options"
    "property=og:title": "Core widgets"
    "keywords": "Plone Aurora, forms, widgets, widget options, extraFields, object browser, image widget, block schema"
---

(core-widgets-label)=

# Core widgets

This page lists the widgets that `@plone/cmsui` registers for its forms: the content forms, the control panels, and the block settings.
For each widget, it gives what the widget is registered for, the value it reads and writes, and its widget options.

Every widget takes the widget contract, `FormWidgetProps`.
For the concepts, see {ref}`form-fields-controls-and-widgets-label`.

## Widget options

A widget option is a key of a field's schema that the form doesn't understand itself.
The form passes it to the widget as a prop, unchanged.
Set widget options in a block schema, or in a content type's schema with the `widgetProps` of `frontendOptions`.

```ts
const blockSchema = {
  // ...
  properties: {
    size: {
      title: 'Size',
      widget: 'size',
      // A widget option of the size widget.
      actions: ['s', 'l'],
    },
  },
};
```

## Overview

| Widget | Registered for | Value |
| --- | --- | --- |
| `TextWidget` | the default widget | a string |
| `TextareaWidget` | `widget: 'textarea'` | a string, which can span several lines |
| `BooleanWidget` | `type: 'boolean'` | a boolean |
| `DateWidget` | `widget: 'date'` | an ISO date, `YYYY-MM-DD`, or `null` |
| `DateTimeWidget` | `widget: 'datetime'` | an ISO 8601 date and time in UTC, such as `2026-10-09T10:00:00Z`, or `null` |
| `AlignWidget` | `widget: 'align'` | the chosen action, such as `left` |
| `SizeWidget` | `widget: 'size'` | the chosen action, such as `m` |
| `WidthWidget` | `widget: 'width'` | the chosen action, such as `full` |
| `ImageWidget` | `widget: 'image'`, `factory: 'Image'` | the image's URL, an app path for site content, or `null` |
| `ObjectBrowserWidget` | `widget: 'object_browser'`, `factory: 'Relation List'`, `vocabulary: 'plone.app.vocabularies.Catalog'` | a list of the selected items |
| `QuerystringWidget` | `widget: 'querystring'` | a query object |
| `RecurrenceWidget` | the `recurrence` field | an RFC 5545 recurrence rule, or `null` |

## Text widgets

`TextWidget` is the default widget: it renders any field that no other widget is registered for.
`TextareaWidget` renders multi-line text, such as the summary of a page.
Neither has widget options.

## `BooleanWidget`

A checkbox.
Without a stored value, it shows the schema's `default`.

## Date widgets

`DateWidget` reads and writes a date without a time, in the `YYYY-MM-DD` form that the content API stores.
`DateTimeWidget` reads an ISO 8601 date and time, shows it in the editor's time zone, and writes it in UTC.

## Pickers: `AlignWidget`, `SizeWidget`, and `WidthWidget`

A row of icon buttons, where the editor picks one action.
Without a stored value, the schema's `default` is selected.

`actions`
:   The actions to offer, in order.
    The defaults are `left`, `right`, `center`, and `full` for alignment; `s`, `m`, and `l` for size; and `narrow`, `default`, `layout`, and `full` for width.

`actionsInfoMap`
:   The icon and the label of each action, by action, to add actions or change the default ones.
    For the size picker, the icon is a short text, such as `S`.

```ts
align: {
  title: 'Alignment',
  widget: 'align',
  actions: ['left', 'center', 'right'],
},
```

## `ImageWidget`

Picks an image: from the site with the object browser, by uploading a file, or by entering a URL.
Its value is the image's URL.
For an image of the site, it's an app path, such as `/news/photo.jpg`.

The widget browses the site from where the form is, and uploads to the form's container.
See {ref}`form-fields-controls-and-widgets-label` for how a widget learns where the form is.

`extraFields`
:   The details of a picked image to also store, each in the form field of the same name: `image_field`, `image_scales`, and `title`.
    When the editor picks an image of the site, the widget writes those details to the listed fields, in the same change as the field's own value.
    An uploaded image only has a `title`, and an entered URL has no details: the other listed fields are cleared, so they never describe a previous image.

    Use it when another field of the form must describe the picked image.
    For example, the image block stores the field and the scales of its image next to its URL, to render it with responsive scales:

    ```ts
    url: {
      title: 'Image URL',
      widget: 'image',
      extraFields: ['image_field', 'image_scales'],
    },
    ```

    Without `extraFields`, the widget only writes its own value.

`hideLinkPicker`, `hideObjectBrowserPicker`, and `restrictFileUpload`
:   Hide the URL input, the object browser button, or the upload button.

`objectBrowserPickerType`
:   How the object browser selects: `single` (the default), `multiple`, or `image`.

`placeholderLinkInput`
:   The placeholder of the URL input.

`imageSize`
:   The scale of the preview, such as `teaser`, the default.

`currentPath` and `uploadPath`
:   Where to browse from, and where to upload to, instead of where the form is.

## `ObjectBrowserWidget`

Picks site content: for example, the related items of a page, or the target of a link.
Its value is a list of the selected items.
Each item is an object with the attributes listed in `selectedItemAttrs`, such as `{ "@id": "/news/my-page", "title": "My page" }`.

The browser starts from where the form is.

`mode`
:   `multiple`, the default, to select several items, or `single` to select one.

`selectedItemAttrs`
:   The attributes to keep of each selected item.
    The default is `@id`, `title`, `description`, `@type`, and `UID`.

`widgetOptions.pattern_options`
:   The options a relation field sends from the backend, such as `selectableTypes`, the content types the editor can select, and `maximumSelectionSize`.

```{note}
Block schemas ported from Volto may set the `link` or `image` mode, or `allowExternals`.
`ObjectBrowserWidget` doesn't support them yet, and treats such a field as `multiple`.
```

## `QuerystringWidget`

Builds a catalog query, for example for a listing.
Its value is an object with the query's criteria, and its sorting and size.

```json
{
  "query": [
    { "i": "portal_type", "o": "plone.app.querystring.operation.selection.any", "v": ["News Item"] }
  ],
  "sort_on": "effective",
  "sort_order": "descending",
  "limit": 10
}
```

## `RecurrenceWidget`

Edits the recurrence of an event in a dialog.
Its value is a recurrence rule in the iCalendar format (RFC 5545), such as `RRULE:FREQ=WEEKLY;BYDAY=MO`, or `null` when the event doesn't repeat.
It reads the event's `start` and `end` from the form, to offer the right days and end date.

(test-a-widget-label)=

## Test your widget against the contract

`@plone/cmsui` ships a test helper that checks a widget against the widget contract.
Run it for each widget you register.
It checks that the widget:

-   renders its label and description;
-   marks a required field;
-   shows its validation error when invalid, and only then;
-   renders without a value;
-   ignores the widget options it doesn't know;
-   reports a change with `onChange(value)`, if you tell it how to make one.

```ts
import { fireEvent, screen } from '@testing-library/react';
import { describeWidgetContract } from '@plone/cmsui/testing/widgetContract';
import { PhoneWidget } from './PhoneWidget';

describeWidgetContract('PhoneWidget', PhoneWidget, {
  // A valid value, as the content API stores it.
  value: '+49 89 1234567',
  // Optional: how an editor changes the value, and the value to expect.
  change: {
    perform: () =>
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: '+49 89 7654321' },
      }),
    expected: '+49 89 7654321',
  },
});
```

The options also take extra `props` for the widget, a `wrapper` for the providers it needs, and `skip`, to skip a check the widget doesn't pass yet.
`skip` takes a reason for each check, so the test report shows what is missing.

```ts
describeWidgetContract('MapWidget', MapWidget, {
  value: { lat: 48.14, lng: 11.58 },
  skip: { required: 'The map has no required state yet.' },
});
```

The core widgets run the same checks, in {file}`packages/cmsui/config/widgets.contract.test.tsx`.

