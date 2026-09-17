---
myst:
  html_meta:
    "description": "How to hide or replace the tags (subjects) shown below content in Plone Aurora"
    "property=og:description": "How to hide or replace the tags (subjects) shown below content in Plone Aurora"
    "property=og:title": "Customize the content tags"
    "keywords": "Plone Aurora, tags, subjects, slot, belowContent"
---

# Customize the content tags

Plone Aurora renders a content item's tags (its `subjects`) below the content as links to the search.
The tags come from a slot component registered for the `belowContent` slot.
This guide shows you how to hide or replace them.

## Hide the tags

Set `showTags` to `false` in your add-on configuration to hide the tags on every page.

```ts
import type { ConfigType } from '@plone/registry';

export default function install(config: ConfigType) {
  config.settings.showTags = false;
  return config;
}
```

The slot renders the tags whenever an item has `subjects`, unless `showTags` is `false`.

## Replace the tags component

Register your own component for the `belowContent` slot under the same name to override the default.

```ts
import type { ConfigType } from '@plone/registry';
import MyTags from './MyTags';

export default function install(config: ConfigType) {
  config.registerSlotComponent({
    name: 'Tags',
    slot: 'belowContent',
    component: MyTags,
  });
  return config;
}
```

Your component receives the slot props, including `content`, from which you can read `content.subjects`.
To learn how slots work in general, refer to {doc}`register-slots`.
