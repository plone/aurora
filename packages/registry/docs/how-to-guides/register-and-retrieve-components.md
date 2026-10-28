---
myst:
  html_meta:
    "description": "How to register, retrieve, adapt, and load components in @plone/registry"
    "property=og:description": "How to register, retrieve, adapt, and load components in @plone/registry"
    "property=og:title": "Register and retrieve components"
    "keywords": "@plone/registry, registry, register, retrieve, components"
---

# Register and retrieve components

This section of the documentation describes how to register, retrieve, adapt, and load components.


## Register components by name

You can register components by name, typically from an add-on or project configuration, using `config.registerComponent`.

```js
import MyToolbarComponent from './MyToolbarComponent'

config.registerComponent({
  name: 'Toolbar',
  component: MyToolbarComponent,
});
```


## Retrieve a component from the component registry

You can programmatically retrieve a component from the component registry using `config.getComponent`.

```js
const Toolbar = config.getComponent('Toolbar').component
```

Alternatively, you can retrieve a component by using the convenience component `Component`, if you want to use it in JSX code directly.

```jsx
import Component from '@plone/volto/components/theme/Component/Component';

<Component componentName="Toolbar" {...props} />
```

Note that you can pass `props` down to the retrieved component.


## Adapt the component

You can register components, then retrieve them, given a list of modifiers using the `dependencies` array.

```js
import MyTeaserNewsItemComponent from './MyTeaserNewsItemComponent'

config.registerComponent({
    name: 'Teaser',
    component: MyTeaserNewsItemComponent,
    dependencies: ['News Item'],
  });
```

To retrieve the component, use `getComponent`.

```js
config.getComponent({
    name: 'Teaser',
    dependencies: ['News Item'],
  }).component
```

If you have a single dependency, you can use a string instead of an array.

You can have both, either with or without dependencies.

```js
import MyTeaserDefaultComponent from './MyTeaserDefaultComponent'
import MyTeaserNewsItemComponent from './MyTeaserNewsItemComponent'

config.registerComponent({
    name: 'Teaser',
    component: MyTeaserDefaultComponent,
  });

config.registerComponent({
    name: 'Teaser',
    component: MyTeaserNewsItemComponent,
    dependencies: 'News Item',
  });
```

After you register them, you can retrieve both or either of them, depending on your use case.
In the next example, given a content type value coming from the `content` prop, you can retrieve them.

```jsx
<Component componentName="Toolbar" dependencies={[props.content['@type']]} {...props} />
```


## Lazy load components

You can lazy load the component in the registry, too, if you need it.

```js
const MyTeaserDefaultComponent = lazy(()=> import(./MyTeaserDefaultComponent))

config.registerComponent({
    name: 'Teaser',
    component: MyTeaserDefaultComponent,
  });
```


(type-registered-components-label)=

## Type registered components

By default, the component registry accepts any component under any name, and `config.getComponent` returns it as `ComponentType<any>`.
To type a component, declare its props under its name in the `ComponentsPropsMap` interface of `@plone/types`.
Then the registry types it by its name:

-   `config.getComponent` returns the component typed with the declared props.
-   `config.registerComponent` rejects a component that requires props that the declared ones don't include.
    This way, the type check fails when an add-on overrides the component with one that doesn't take its props.


### Declare the props of a component

Declare the props with a module augmentation of `@plone/types`, next to where you register the component.

```ts
import type { ComponentProps } from 'react';
import type { ConfigType } from '@plone/registry';
import Toolbar from './Toolbar';

declare module '@plone/types' {
  export interface ComponentsPropsMap {
    Toolbar: ComponentProps<typeof Toolbar>;
  }
}

export default function install(config: ConfigType) {
  config.registerComponent({ name: 'Toolbar', component: Toolbar });

  return config;
}
```

Declare a name only once, in the package that registers the original component.
An add-on that overrides the component doesn't declare it again.


### Retrieve a typed component

`config.getComponent` returns the component typed with the declared props, whether you pass the name or an object.

```tsx
const Toolbar = config.getComponent('Toolbar').component;

if (!Toolbar) {
  return null;
}

return <Toolbar {...props} />;
```

The `component` is still `undefined` when nothing is registered under the name, so check it before you render it.
The declaration only describes the types, and doesn't register the component.


### Override a typed component

To override a typed component, register yours under the same name.
Your component must take the props of the original.
It may ignore some of them, but it can't require props that the original doesn't get.

```tsx
import type { ComponentProps } from 'react';
import Toolbar from './Toolbar';

// Takes the props of the original `Toolbar`: accepted.
const MyToolbar = (props: ComponentProps<typeof Toolbar>) => (
  <Toolbar {...props} className="my-toolbar" />
);

config.registerComponent({ name: 'Toolbar', component: MyToolbar });

// Requires a `count` prop, which the original doesn't get: type error.
const Badge = (props: { count: number }) => <span>{props.count}</span>;

config.registerComponent({ name: 'Toolbar', component: Badge });
```


### Type a generic component

A props type can't carry a type parameter.
For a generic component, such as a component with an `as` prop that takes the props of the element it renders, declare its full signature with `ComponentSignature` instead.
Then `config.getComponent` keeps the type parameter.

```ts
import type { ElementType, ReactNode } from 'react';
import type { ComponentSignature } from '@plone/types';
import type { ContainerProps } from '@plone/components';

declare module '@plone/types' {
  export interface ComponentsPropsMap {
    Container: ComponentSignature<
      <T extends ElementType = 'div'>(props: ContainerProps<T>) => ReactNode
    >;
  }
}
```

Declare the signature's return type as `ReactNode`, instead of deriving the signature with `typeof Container`.
`typeof Container` returns `JSX.Element`, which would reject an override that returns `null`.


### Components with dependencies

A component registered with `dependencies` takes the props declared for its name.
Both `config.getComponent({ name: 'Teaser', dependencies: 'News Item' })` and `config.getComponent('Teaser|News Item')` use the props declared for `Teaser`.


### Undeclared names

Components registered under names that aren't declared in `ComponentsPropsMap` take any props, as before.


### Where the declaration applies

TypeScript only applies a module augmentation when it compiles the file that contains it.
A package that doesn't import, directly or indirectly, the file with the declaration gets components typed as `ComponentType<any>`.

If a package can't import that file, for example because the package that declares it depends on it, the package can declare the same entry itself.
The two declarations merge if their types are identical.
If they differ, the type check fails with `Subsequent property declarations must have the same type`.
