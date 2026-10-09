---
myst:
  html_meta:
    "description": "An explanation of fields, controls, widgets, and widget adapters in Plone Aurora forms"
    "property=og:description": "An explanation of fields, controls, widgets, and widget adapters in Plone Aurora forms"
    "property=og:title": "Form fields, controls, widgets, and adapters"
    "keywords": "Plone Aurora, forms, fields, controls, widgets, adapters, @plone/cmsui"
---

(form-fields-controls-and-widgets-label)=

# Form fields, controls, widgets, and adapters

Plone Aurora forms are schema-driven.
A content type's schema describes its fields, and the form generator turns each field into something the editor can interact with.
Four concepts take part in that process: fields, controls, widgets, and adapters.
This guide explains each of them, how they work together, and why Plone Aurora keeps them apart.

## The big picture

The following diagram follows one field, `exclude_from_nav`, from its schema to the checkbox an editor clicks, and back.

```{image} /_static/conceptual-guides/form-field-widget-control.svg
:alt: The schema describes a field. The form keeps the field's value and state, and asks the widget registry which widget renders it. The widget receives the field props and renders a control. When the user clicks the control, the widget reports the new value with onChange(true), and the form stores it.
```

Read the diagram from left to right for the way down:

1.  The **schema field** describes the data: its name, type, title, and default value.
2.  The **form** holds the field's current value and state, and asks the widget registry which **widget** renders it.
3.  The **widget** receives a fixed set of field props, such as `value`, `label`, and `required`, and renders one or more **controls**.
4.  The **control** is the interactive element the editor sees, here a checkbox.

The dashed arrows are the way back.
The control reports its own change, `isSelected = true`, and the widget translates it into the field's value, `onChange(true)`, which the form stores.

If you already know HTML forms or relational databases, the following comparisons can help:

| Concept | Similar to | But in Plone Aurora |
| --- | --- | --- |
| Field | A column in a relational table, plus the value being edited | It also carries form state: validation errors, required, touched, and so on. |
| Control | An [HTML form control](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Basic_native_form_controls), such as `<input type="checkbox">` | Usually a component of a design system, such as a Quanta or React Aria component, which renders the HTML control. |
| Widget | A complex input, such as a date range picker | **Every** field gets a widget, even a simple one. A widget can be as small as a text input or as large as an image picker. |
| Adapter | Glue code | A widget whose only job is to translate between the widget contract and a control's API. |

## Field

A field is one piece of content data, as the form sees it.
It comes from a property in the content type's schema.
For example, `title`, `description`, and `exclude_from_nav` are fields of a page.

A field has more than a value.
The form also tracks its validation state and whether it is required, and the schema adds hints such as its title, description, default value, choices, vocabulary, and widget options.

A field belongs to the form.
It takes part in the form's state, validation, and submission.
It does not decide how it is displayed: that is the widget's job.

## Control

A control is the lowest layer of a form: the interactive element itself.
Examples include a text input, a checkbox, a select, a date picker, and a segmented control.
In Plone Aurora, controls usually come from a design system, such as the Quanta components in `@plone/quanta`, which build on React Aria.

A control knows how to render one interaction pattern and how to make it accessible.
It knows nothing about Plone: schemas, fields, vocabularies, validation messages, or how the content API stores a value.
Its props follow the interaction pattern and the library that implements it.

For example, a React Aria checkbox has `isSelected`, `isRequired`, and `onChange(isSelected)`.
That is a good API for a checkbox.
It is not the API that a schema-driven form uses, which passes every field a `value`, a `label`, `required`, and an `onChange(value)` callback.

## Widget

A widget renders a field.
It is the component that the widget registry returns for a field, and it receives the same set of props as every other widget: the widget contract.

A widget turns the field into controls.
It renders the field's label and description, shows the current value, and reports changes with `onChange(value)`, using the shape of value that the content API expects.
It shows the field as required, disabled, read-only, or invalid when the form says so.

Widgets differ in size, not in contract.
A text widget can be a thin wrapper around one text input.
An image widget can combine an object browser, an upload button, a link input, a preview, and a clear button.
Both are widgets, because both take the same field props and emit the field's value.

## Adapter

An adapter is a widget that wraps a single control.
It translates the widget contract to the control's API: it renames props, converts values, and passes validation state in the shape the control expects.

### Example: the boolean widget

The checkbox control speaks `isSelected`.
The form speaks `value`.
`BooleanWidget` adapts one to the other:

```tsx
import type { FormWidgetProps } from '@plone/types';
import { Checkbox } from '@plone/quanta';

function BooleanWidget({
  name,
  value,
  defaultValue,
  onChange,
  onBlur,
  label,
  required,
  disabled,
  readOnly,
  className,
}: FormWidgetProps<boolean>) {
  return (
    <div className={className}>
      <Checkbox
        name={name}
        isSelected={!!(value ?? defaultValue)}
        isRequired={required}
        isDisabled={disabled}
        isReadOnly={readOnly}
        onChange={onChange}
        onBlur={onBlur}
      >
        {label}
      </Checkbox>
    </div>
  );
}
```

The following table shows how each prop is mapped.

| Widget contract (from the form) | Checkbox control |
| --- | --- |
| `value`, falling back to `defaultValue` | `isSelected` |
| `required` | `isRequired` |
| `disabled` | `isDisabled` |
| `readOnly` | `isReadOnly` |
| `label` | the checkbox's children |
| `onChange(value)` | `onChange(isSelected)`, which already emits a boolean |

### Example: a date widget

Some adapters must also convert values.
A React Aria date field works with `DateValue` objects, while the content API stores a date as an ISO string such as `"2026-10-09"`.
A date widget converts the string to a `DateValue` for the control, and converts the control's `DateValue` back to a string for `onChange`:

```ts
import { parseDate } from '@internationalized/date';
import type { FormWidgetProps } from '@plone/types';
import { DateField } from '@plone/components';

// The value can be cleared, so the widget emits `null` too.
type DateWidgetProps = FormWidgetProps<string | null>;
```

```tsx
function DateWidget({ value, onChange, label, required }: DateWidgetProps) {
  return (
    <DateField
      label={label}
      isRequired={required}
      value={value ? parseDate(value) : null}
      onChange={(date) => onChange(date ? date.toString() : null)}
    />
  );
}
```

The form never sees a `DateValue`.
It passes a string in and receives a string back, the same as for any other field.

## The widget contract

Every registered widget accepts the same props.
`@plone/types` describes them with two types.

`FormWidgetProps<T>` describes the props a widget receives.
`T` is the type of the field's value.
Use it when you write a widget or an adapter:

```tsx
import type { FormWidgetProps } from '@plone/types';

function BooleanWidget(props: FormWidgetProps<boolean>) {
  // ...
}
```

`FormWidget<T>` describes the widget component itself.
Use it to type a variable, a registry entry, or an exported component:

```tsx
import type { FormWidget } from '@plone/types';

const BooleanWidget: FormWidget<boolean> = (props) => {
  // ...
};
```

The essential props are the following.

`name`
:   The field's name in the form data.

`value`
:   The stored value.
    It can be `null` or `undefined` when the content has no value yet.

`onChange(value)`
:   Reports the next value, always in the shape that the content API expects.

`label`, `description`, and `placeholder`
:   Text for the editor.

`required`, `disabled`, and `readOnly`
:   The field's state.

`errorMessage` and `errors`
:   The field's validation errors.

The contract is about values.
The form does not need to know whether a widget uses an HTML input, a React Aria component, a modal picker, or several controls together.
It passes the current value in and receives the next value back.

## Why controls are not registered as widgets

A control's API is right for its interaction pattern, but it does not follow the widget contract.

-   A checkbox uses `isSelected` instead of `value`.
-   A date picker emits a date object, while the content API expects an ISO string.
-   A select knows about option labels, but not about Plone vocabularies.
-   An object browser needs the current content, the content types it can select, and a relation value.

If controls were registered directly, the form generator would have to know each of these APIs.
The registry could no longer promise what a widget receives and what it emits.
Adapters keep that promise in one place: the widget.

A control can be registered as a widget only when its API already matches the widget contract.
A plain text input comes close.
Checkboxes, date pickers, object browsers, image pickers, and rich text editors need adapters.

## Where controls and widgets live

Controls and widgets live in different packages, because they speak different APIs.
How simple a component is does not decide where it lives; the API it speaks does.

`@plone/quanta`
:   The CMS design system.
    It provides controls, with the API of their interaction pattern and of React Aria.
    It does not know the widget contract, and does not depend on `@plone/types`.
    Name its components after what they are, such as `Checkbox` or `RadioGroup`, not after a widget.

`@plone/cmsui`
:   The CMS forms.
    It provides the widgets and adapters that use the widget contract, and registers them in the widget registry.

For example, `BooleanWidget` is small, but it is an adapter: it takes the widget contract and maps it to the Quanta `Checkbox` control.
So it lives in `@plone/cmsui`, next to complex widgets such as `ObjectBrowserWidget`, and not in `@plone/quanta`.

A form for another audience, such as a public contact form, uses the controls of its own design system.
It needs adapters of its own, for those controls.

## How the form picks a widget

The form and the widget registry answer different questions.
The form asks, "What is the value and state of this field?"
The widget registry asks, "Which widget renders this field?"

The form looks the widget up from the field's schema hints, in this order:

1.  The field's name, for example `recurrence`.
2.  The widget named in the field's tagged values, `frontendOptions.widget`.
3.  The field's `widget` hint, for example `textarea` or `datetime`.
4.  The field's choices or vocabulary.
5.  The field's factory, for example `Relation List`.
6.  The field's type, for example `boolean`.
7.  The default widget.

Whichever widget it finds, the widget receives the same contract.
That is what lets the form generator stay generic.

## Design implications

The form generator should be basic.
It should resolve widgets, pass normalized field props, and connect changes back to the form state.
It should not contain special cases for checkbox selection state, date serialization, upload workflows, relation values, or vocabulary fetching.
Widgets should own those differences.

That keeps each widget testable on its own, and keeps the schema-driven form renderer easy to understand.
It also makes the registry safer for add-ons, because an add-on can register widgets against one documented contract, instead of working out what the form currently passes.

## Glossary

Field
:   One piece of content data as the form sees it: its value, its state, and the hints from its schema property.

Control
:   An interactive element of a form, such as a text input or a checkbox, usually provided by a design system.
    It has its own API and knows nothing about Plone.

Widget
:   The component that renders a field.
    Every widget accepts the same props, the widget contract, and emits the field's value with `onChange(value)`.

Adapter
:   A widget that wraps a single control and translates between the widget contract and the control's API.

Widget contract
:   The props that every widget receives from the form, described by `FormWidgetProps` in `@plone/types`.

Widget registry
:   The part of the configuration registry that maps fields to widgets, by field name, widget name, vocabulary, factory, or type.
