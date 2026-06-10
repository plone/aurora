---
myst:
  html_meta:
    "description": "How to hide or replace the related items list shown below content in Plone Aurora"
    "property=og:description": "How to hide or replace the related items list shown below content in Plone Aurora"
    "property=og:title": "Customize the related items"
    "keywords": "Plone Aurora, related items, slot, belowContent"
---

# Customize the related items

Plone Aurora renders a content item's related items below the content as links.
The list comes from a slot component registered for the `belowContent` slot.
This guide shows you how to hide or replace it.

## Hide the related items

Set `showRelatedItems` to `false` in your add-on configuration to hide the list on every page.

```ts
import type { ConfigType } from '@plone/registry';

export default function install(config: ConfigType) {
  config.settings.showRelatedItems = false;
  return config;
}
```

The slot renders the list whenever an item has `relatedItems`, unless `showRelatedItems` is `false`.

## Replace the related items component

Register your own component for the `belowContent` slot under the same name to override the default.

```ts
import type { ConfigType } from '@plone/registry';
import MyRelatedItems from './MyRelatedItems';

export default function install(config: ConfigType) {
  config.registerSlotComponent({
    name: 'RelatedItems',
    slot: 'belowContent',
    component: MyRelatedItems,
  });
  return config;
}
```

Your component receives the slot props, including `content`, from which you can read `content.relatedItems`.
To learn how slots work in general, refer to {doc}`register-slots`.
