---
myst:
  html_meta:
    "description": "How to create a new slot in Plone Aurora, including the slot point, the default slot component, and the recommended conventions."
    "property=og:description": "How to create a new slot in Plone Aurora, including the slot point, the default slot component, and the recommended conventions."
    "property=og:title": "Create a new slot"
    "keywords": "Plone Aurora, Plone, frontend, React, slots, customization"
---

# Create a new slot

This guide shows you how to add a new slot to Plone Aurora, ship a default component for it, and follow the conventions the existing default slots in `@plone/layout` use.

A new slot has two parts.

1. Render a slot point with `<SlotRenderer name="..." />` so add-ons can plug in.
2. Register a default slot component on that slot point so the slot has content out of the box.

If you only need to plug into an existing slot point, do not add a new slot.
Refer to {doc}`register-slots` to register your component on a slot that already exists.


## Render a slot point

A slot point is a `<SlotRenderer>` placed in a parent component that any add-on can extend.
Pass the slot name, the current `content`, and the React Router `location`.

```tsx
import SlotRenderer from '@plone/layout/slots/SlotRenderer';

<SlotRenderer name="belowContent" content={content} location={location} />
```

Pick the smallest parent that owns the visual area the slot extends.
Aurora already renders `aboveContent`, `belowContent`, `header`, `footer`, and a few others in `@plone/layout`.
Only add a new slot point when no existing slot covers the area.


## Build the default slot component

A slot component receives `SlotComponentProps` and reads from `content`.
Return `null` when the component has nothing to render so the slot point does not produce an empty wrapper.

```tsx
import { useTranslation } from 'react-i18next';
import { Link } from '@plone/components';
import config from '@plone/registry';
import type { SlotComponentProps } from '../SlotRenderer';
import SectionWrapper from '../../components/SectionWrapper/SectionWrapper';
import styles from './Authors.module.css';

const Authors = (props: SlotComponentProps) => {
  const { t } = useTranslation();
  const items = props.content.creators ?? [];

  const showAuthors = config.settings.showAuthors !== false;
  if (!showAuthors || items.length === 0) {
    return null;
  }

  return (
    <SectionWrapper
      as="nav"
      width="layout"
      aria-label={t('layout.authors.label')}
    >
      <ul className={styles.authors}>
        {items.map((author) => (
          <li key={author}>
            <Link href={`/@search?Creator=${encodeURIComponent(author)}`}>
              {author}
            </Link>
          </li>
        ))}
      </ul>
    </SectionWrapper>
  );
};

export default Authors;
```

The component above follows the conventions Aurora's default slots use.

- Import `<Link>` from `@plone/components` rather than `react-router`.
  The Aurora link handles Plone backend URLs and flattens them to site-relative paths.
- Wrap the slot output in `<SectionWrapper>` from `@plone/layout/components/SectionWrapper` to inherit the width-aware section layout the other default slots use.
- Translate the `aria-label` through `react-i18next` so the slot stays accessible in every supported language.
- Read flags from `config.settings` against the existing `SettingsConfig` type in `@plone/types`.
  Declare any new setting in `packages/types/src/config/Settings.d.ts`.


## Register the default slot component

Default slot components for the Aurora layout live in `packages/layout/config/slots.ts`.
Import the component and add a `config.registerSlotComponent` call to ship it as the default for your slot.

```ts
import Authors from '../slots/Authors/Authors';

config.registerSlotComponent({
  name: 'Authors',
  slot: 'belowContent',
  component: Authors,
});
```


## Best practices

### Use a CSS module for default slots

Default slots ship with `@plone/layout`, so their styles must not collide with project styles.
Put the styles next to the component in a `<SlotName>.module.css` file and import them as a module.

```css
@layer custom {
  .authors {
    display: flex;
    flex-direction: column;
    padding: 0;
    margin-top: 24px;
    gap: 8px;
    list-style: none;
  }
}
```

The `@layer custom` wrapper keeps the styles in the layer Aurora uses for component-local rules.
Project themes can still override individual properties without raising specificity.


### Add an opt-out setting

A default slot component must be opt-out, not always-on.
Read a `show<SlotName>` flag from `config.settings` and return `null` when the value is `false`.

```ts
const showAuthors = config.settings.showAuthors !== false;
if (!showAuthors || items.length === 0) {
  return null;
}
```

Declare the flag in `packages/types/src/config/Settings.d.ts` to keep it type-safe.

```ts
showAuthors: boolean;
```

Existing examples in Aurora are `showTags` and `showRelatedItems`.


### Translate user-facing strings

Use `react-i18next`'s `useTranslation` for any user-visible text, including `aria-label` values.
Add the translation keys to every locale file under `packages/layout/locales/<lang>/common.json`.

```json
"authors": {
  "label": "Authors"
}
```

A missing translation falls back to the key string, which surfaces missing locale entries during review.


### Ship a news fragment

Add `packages/layout/news/<issue-number>.feature` so the slot appears in the next release notes.

```text
Added an Authors slot that renders a content item's creators as links below the content. @your-handle
```


### Provide a how-to guide for end users

When a default slot has user-visible behavior, add a short how-to guide under `docs/how-to-guides/` that documents the setting and the slot name used for replacement.
For the structure to follow, refer to {doc}`customize-login-screen`.


## Customize or replace the slot

Once the slot is in place, anyone can register a different component on the same slot to override the default.

```ts
config.registerSlotComponent({
  slot: 'belowContent',
  name: 'Authors',
  component: MyAuthors,
});
```

Use the same `slot` and `name` as the default registration.
Because the override runs after `@plone/layout`, it becomes the active registration.

For ordering, predicates, and unregistration, refer to {doc}`register-slots`.
