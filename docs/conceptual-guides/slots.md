---
myst:
  html_meta:
    "description": "Slots are insertion points in the Plone Aurora rendering tree structure."
    "property=og:description": "Slots are insertion points in the Plone Aurora rendering tree structure."
    "property=og:title": "Slots"
    "keywords": "Plone Aurora, Plone, frontend, React, configuration, slots, viewlets"
---

# Slots

Slots provide a way for Plone Aurora add-ons to insert their own components at predefined locations in the rendered page.

```{note}
This concept is inspired by the Plone Classic UI {doc}`plone:classic-ui/viewlets`.
```

In Plone Aurora, all structural elements—such as Header, Content Area, and Footer—are slots.
Also, significant parts of the website—such as Logo, tools, and sections—are slots, too.
You can add, modify, reorder, or remove any component assigned to a slot programmatically using the configuration registry API.

## Anatomy

Slots have a name, and they contain a list of named slot components.

Plone Aurora renders slots using the `SlotRenderer` component.
You can add additional slot insertion points in your code, as shown in the following example.

```ts
import SlotRenderer from '@plone/layout/slots/SlotRenderer';
//...
<SlotRenderer name="aboveContent" content={content} />
```

Slot components are registered in the {ref}`configuration registry using a specific API for slots <configuration-registry-for-slot-components>`.

The rendering of a slot component is controlled by the presence or absence of a list of conditions called {term}`predicates`.

You can register multiple slot components with the same name under the same slot, as long as they have different predicates or components.

See {doc}`../how-to-guides/register-slots` for more information about registering slots.
