---
myst:
  html_meta:
    "description": "Validate form fields in Plone Aurora with validators registered in the configuration registry"
    "property=og:description": "Validate form fields in Plone Aurora with validators registered in the configuration registry"
    "property=og:title": "Validate form fields"
    "keywords": "Plone Aurora, forms, fields, validation, validators, registry, content types, blocks, control panels"
---

(validate-form-fields-label)=

# Validate form fields

Plone Aurora validates the fields of every schema-driven form: content add and edit forms, control panels, and block settings.
The validation is extensible through the {term}`configuration registry`: a validator is a utility, and your add-on can register its own validators, or override the ones Plone Aurora provides.

This guide shows how to register validators for the common cases and the advanced ones.
For the concepts behind fields, widgets, and the widget contract, see {ref}`form-fields-controls-and-widgets-label`.

## How validation works

The form builds the validators of its fields from their schema when it is created.
For each field, it combines two kinds of checks.

The required check
:   A field listed in the schema's `required` list must not be empty.
    `undefined`, `null`, an empty string, an empty list, and rich text without text count as empty.
    Boolean and read-only fields are not checked.
    Plone Aurora does this check itself; you don't register a validator for it.

Registered validators
:   Every validator whose dependencies match the field runs on it.
    They only run when the field has a value: an empty optional field is valid.

A validator returns an error message, or nothing if the value is valid.
When several validators report errors, the field shows all of their messages.

Errors show once the editor leaves the field, or tries to save.
Saving an invalid form doesn't send anything.
Instead, the form shows the errors, switches the content form to its {guilabel}`Content` tab, and focuses the first invalid field.

The server validates the data too.
If it rejects a save with validation errors, the form shows them on their fields, the same way.

```{note}
The widget of a field shows its errors through the `invalid` and `errorMessage` props of the widget contract.
A custom widget must render them, or its errors stay invisible.
See {ref}`form-fields-controls-and-widgets-label`.
```

(default-validators-label)=

## Default validators

Plone Aurora registers the following validators by default.
You can find them in {file}`packages/cmsui/config/validators.ts`.

### Strings and passwords

Fields of type `string` or `password`.

`minLength`
:   The value is at least `minLength` characters long.

`maxLength`
:   The value is at most `maxLength` characters long.

`pattern`
:   The value matches the regular expression in `pattern`.

### Numbers and integers

`number`
:   A field of type `number` holds a number.

`integer`
:   A field of type `integer` holds an integer.

`minimum` and `maximum`
:   The value of a `number` or `integer` field is within `minimum` and `maximum`.

### Lists

Fields of type `array`.

`minItems` and `maxItems`
:   The list has at least `minItems`, and at most `maxItems`, items.

`uniqueItems`
:   With `uniqueItems: true`, the list has no duplicate items.

### Per widget

`email`
:   A field with the `email` widget holds a valid email address.

`url`
:   A field with the `url` widget holds a valid URL.

### Event content type

`dateRange`
:   An event's start date is on or before its end date, and its end date is on or after its start date.
    It applies to the `start` and `end` fields of the `plone.eventbasic` behavior.

### Per format

`default_language`
:   A field with the `default_language` format holds one of the languages in the form's `available_languages` field.

## Register a validator

Register validators in the configuration of your add-on, with `registerUtility`.
A validator is a utility of type `validator`, and its `dependencies` decide which fields it applies to.

```ts
import type { ConfigType } from '@plone/registry';
import { phoneValidator } from './validators';

export default function install(config: ConfigType) {
  config.registerUtility({
    type: 'validator',
    name: 'phone',
    dependencies: { format: 'phone' },
    method: phoneValidator,
  });

  return config;
}
```

The `name` identifies the validator.
Together with the `dependencies`, it also lets you override it later (see {ref}`override-a-validator-label`).

### Validate a field by its format

The most common case: you control the schema of the field, so you declare what kind of value it holds with `format`, and register a validator for that format.

#### Block settings and custom forms

In a block schema, or any schema you define in code, set `format` on the field.

```ts
const blockSchema = {
  fieldsets: [{ id: 'default', title: 'Default', fields: ['phone'] }],
  properties: {
    phone: {
      title: 'Phone number',
      format: 'phone',
    },
  },
  required: [],
};
```

Then register a validator for that format.

```ts
config.registerUtility({
  type: 'validator',
  name: 'phone',
  dependencies: { format: 'phone' },
  method: phoneValidator,
});
```

#### Content types

In a content type, declare the format in the backend, with the schema hints of `frontendOptions`.

```python
from plone.autoform import directives
from plone.supermodel import model
from zope import schema


class IMyContent(model.Schema):
    directives.widget(
        "phone",
        frontendOptions={
            "format": "phone",
        },
    )
    phone = schema.TextLine(
        title="Phone number",
        required=False,
    )
```

plone.restapi returns the hint in the field's `widgetOptions`.
It looks slightly different from a block schema, but the validator registered for the `phone` format applies the same way.

```json
{
  "properties": {
    "phone": {
      "title": "Phone number",
      "type": "string",
      "widgetOptions": {
        "frontendOptions": {
          "format": "phone"
        }
      }
    }
  }
}
```

### Advanced scenarios

Sometimes you can't change the schema of an existing content type, block, or form.
Then register the validator for something the field already has: its type, its widget, the behavior it comes from, or the block it belongs to.

#### By field type

The validator applies to every field of a `type`.
A content type field gets its `type` from its serialization; in a block schema, set it yourself.
A field without a `type` counts as a `string`.

```ts
const blockSchema = {
  // ...
  properties: {
    columns: {
      title: 'Columns',
      type: 'integer',
      maximum: 4,
    },
  },
};
```

```ts
config.registerUtility({
  type: 'validator',
  name: 'maximum',
  dependencies: { fieldType: 'integer' },
  method: maximumValidator,
});
```

#### By widget

The validator applies to every field rendered with a `widget`.
In a block schema, set `widget` on the field.

```ts
const blockSchema = {
  // ...
  properties: {
    phone: {
      title: 'Phone number',
      widget: 'phoneNumber',
    },
  },
};
```

```ts
config.registerUtility({
  type: 'validator',
  name: 'phoneNumber',
  dependencies: { widget: 'phoneNumber' },
  method: phoneValidator,
});
```

In a content type, set the widget in the backend with `frontendOptions`.

```python
class IMyContent(model.Schema):
    directives.widget(
        "phone",
        frontendOptions={
            "widget": "phoneNumber",
        },
    )
    phone = schema.TextLine(
        title="Phone number",
        required=False,
    )
```

#### By behavior and field name

The validator applies to one field of a behavior, in every content type that has the behavior.
It only applies to content types.

```ts
config.registerUtility({
  type: 'validator',
  name: 'dateRange',
  dependencies: {
    behaviorName: 'plone.eventbasic',
    fieldName: 'start',
  },
  method: startEventDateRangeValidator,
});
```

#### By block type and field name

The validator applies to one field of a block's settings.
It only applies to blocks.

```ts
config.registerUtility({
  type: 'validator',
  name: 'url',
  dependencies: {
    blockType: 'slider',
    fieldName: 'url',
  },
  method: urlValidator,
});
```

### How validators match a field

The form looks up the validators of each field with the following dependencies, and runs **all** that match, in this order.

1.  `format`: the field's `format`, or the `format` of its `frontendOptions`.
2.  `fieldType`: the field's `type`, `string` by default.
3.  `widget`: the field's widget, or the widget of its `frontendOptions`.
4.  `behaviorName` and `fieldName`: the behavior the field comes from, and the field's name.
5.  `blockType` and `fieldName`: the type of the block whose settings the form edits, and the field's name.

The validators see the field with its `frontendOptions` widget props merged in, the same way the widget does.

The form builds its validators when it is created.
A validator registered while a form is open applies to the forms created after it.

(override-a-validator-label)=

### Override a validator

Register a validator with the same `name` and the same `dependencies` as an existing one: the last registration wins.
For example, the following replaces Plone Aurora's `url` validator with a stricter one that only accepts HTTPS.

```ts
config.registerUtility({
  type: 'validator',
  name: 'url',
  dependencies: { widget: 'url' },
  method: ({ value, t }) =>
    String(value).startsWith('https://')
      ? null
      : t('my-add-on.validation.https'),
});
```

To turn a validator off, override it with one that always returns `null`.

## Write a validator

A validator is a function with the following signature.

```ts
import type { ValidatorUtility } from '@plone/types';

type ValidatorUtilityArgs = {
  // The field's value. Validators only run on non-empty values.
  value: any;
  // The field's schema property.
  field: Record<string, any>;
  // The field's name in the form data.
  fieldName: string;
  // All the form's values, to compare fields.
  formData: any;
  // Translates a message, like i18next's `t`.
  t: (key: string, options?: Record<string, unknown>) => string;
};

// Returns an error message, or `null` or `undefined` if the value is valid.
type ValidatorUtility = (args: ValidatorUtilityArgs) => string | null | undefined;
```

Use `ValidatorUtility` to type your validator.
The following example checks a phone number.

```ts
import type { ValidatorUtility } from '@plone/types';

const PHONE = new RegExp('^[+]?[0-9 ()-]{6,}$');

export const phoneValidator: ValidatorUtility = ({ value, t }) =>
  PHONE.test(String(value)) ? null : t('my-add-on.validation.phone');
```

A validator reads the limits it checks from the field's schema, so the same validator works for every field.
For example, Plone Aurora's `minLength` validator reads `field.minLength`.

```ts
export const minLengthValidator: ValidatorUtility = ({ value, field, t }) =>
  field.minLength !== undefined && String(value).length < field.minLength
    ? t('cmsui.validation.minLength', { len: field.minLength })
    : null;
```

### Translate the error messages

Return translated messages with `t`.
Add the messages to your add-on's translation files, under a key with your add-on's name.

```json
{
  "my-add-on": {
    "validation": {
      "phone": "Enter a phone number, for example +49 89 1234567.",
      "https": "The address must start with https://."
    }
  }
}
```

See {doc}`../development/i18n` for where translation files go and how they are loaded.

## Invariants: validate a field against other fields

`formData` holds all the form's values, so a validator can compare the field with other fields.
This is how you check an invariant, such as an event ending after it starts.

```ts
export const endEventDateRangeValidator: ValidatorUtility = ({
  value,
  formData,
  t,
}) =>
  formData?.start && new Date(value) < new Date(formData.start)
    ? t('cmsui.validation.endEventRange', { start: formData.start })
    : null;
```

Register the validator for the field that should show the error.
To show an error on both fields, register a validator for each of them, as Plone Aurora does for the event's `start` and `end`.

The validator runs again whenever its field's value changes.
It also runs on every change of the other fields, because it reads them through `formData`, so its error updates as soon as the editor fixes either field.
