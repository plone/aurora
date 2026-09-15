---
myst:
  html_meta:
    "description": "Couple block schema fields with onChangeSideEffects in Plone Aurora"
    "property=og:description": "Couple block schema fields with onChangeSideEffects in Plone Aurora"
    "property=og:title": "Couple block schema fields"
    "keywords": "Plone Aurora, blocks, schema, side effects, block settings"
---

# Couple block schema fields

Sometimes changing one block field should also change another.
For example, in the image block, choosing a left or right alignment (which floats the image) fixes the block width to `default` and drops the large image size, because a floated image needs a fixed, narrow footprint for the surrounding content to wrap around it.

This guide explains how to express that coupling with `onChangeSideEffects`, the single, schema-driven tap point for reacting to a field change in the block settings form.

## How it works

The block settings form has one place where a field change flows out: the `onChange` handler in `BlockSettingsForm`.
After it writes the changed value into a copy of the block data, it looks up the changed field's schema property and, if present, calls its `onChangeSideEffects` function.
Whatever that function returns is merged into the block data before the change is committed.

```ts
onChange: (value) => {
  let nextData = setValueByPath(currentData, fieldName, value);

  const sideEffects =
    schema.properties[fieldName]?.onChangeSideEffects?.(value, nextData);

  if (sideEffects) {
    for (const [key, patchValue] of Object.entries(sideEffects)) {
      nextData = setValueByPath(nextData, key, patchValue);
    }
  }

  onFormDataChange(nextData);
};
```

The important consequences are:

- Side effects are **declarative** and live in the block schema, next to the field they belong to.
- They run for **any** block, because the tap point is generic.
- They fire only when a field changes **through the settings form**, not on load. Use the reactive schema (see below) to keep the editor UI consistent for already-stored data.

## The `onChangeSideEffects` signature

```ts
onChangeSideEffects: (
  value: unknown,
  nextData: BlocksFormData,
) => Record<string, unknown>;
```

`value`
:   the new value of the field that just changed.

`nextData`
:   the block data with `value` already applied. Read other fields from here to decide what to patch.

The return value is a map of `fieldName` to the value to set.
Keys are resolved with the same path logic as normal fields, so nested paths such as `styles.theme` work too.
Return an empty object (`{}`) to change nothing.

## Combine it with a reactive schema

`onChangeSideEffects` only writes data. To also **disable** controls or **restrict** their options, make the schema a function of `formData` and set the relevant properties reactively.
The block settings form re-evaluates the schema on every change, so these update live.

- `isDisabled: true` disables the field's widget (forwarded to the underlying control).
- `actions` limits the values a `choices`/`actions` widget offers.
- `value` makes the widget controlled, so a value coerced by a side effect is reflected immediately.

## Image block example

The image block couples `align` with `size` and `blockWidth`:

```ts
export function ImageSchema({
  formData = {} as BlocksFormData,
}: { formData?: BlocksFormData } = {}): JSONSchema {
  const isFloated = (align?: unknown) => align === 'left' || align === 'right';
  const floated = isFloated(formData.align);

  return {
    // ...
    properties: {
      blockWidth: {
        title: 'Block width',
        widget: 'width',
        default: 'default',
        // Fixed to `default` and not editable while floated.
        value: floated ? 'default' : (formData.blockWidth ?? 'default'),
        isDisabled: floated,
        styleField: true,
      },
      align: {
        title: 'Alignment',
        widget: 'align',
        default: 'center',
        actions: ['left', 'right', 'center'],
        onChangeSideEffects: (value: string, data: BlocksFormData) => {
          if (isFloated(value)) {
            const currentSize = (data.size as string) ?? 'l';
            return {
              blockWidth: 'default',
              size: currentSize === 'l' ? 'm' : currentSize,
            };
          }
          return {};
        },
        styleField: true,
      },
      size: {
        title: 'Image size',
        widget: 'size',
        default: 'l',
        // Large is only available for centered images.
        actions: floated ? ['s', 'm'] : ['s', 'm', 'l'],
        value: floated
          ? (formData.size as string) === 'l' || !formData.size
            ? 'm'
            : (formData.size as string)
          : ((formData.size as string) ?? 'l'),
        styleField: true,
      },
    },
    required: [],
  };
}
```

The two mechanisms work together:

- `align.onChangeSideEffects` **writes** the coupled values (`blockWidth: 'default'`, and a large `size` coerced to medium) so the stored data — and therefore the rendered block — stays consistent.
- The reactive `blockWidth.isDisabled`, `size.actions` and the controlled `value`s **present** that state in the editor: the width control is disabled, the large size is not offered, and the coerced values are shown.

Switching back to `center` returns an empty object from `onChangeSideEffects`, and the reactive schema re-enables the width control and re-offers the large size.

## Summary

To react to a field change in a block:

- add `onChangeSideEffects(value, nextData)` to the field's schema property, returning a `fieldName -> value` map of patches
- return `{}` when no change is needed
- pair it with a reactive schema (`isDisabled`, `actions`, controlled `value`) so the editor UI matches the stored data, including for content saved before the coupling existed
