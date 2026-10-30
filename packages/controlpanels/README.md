# @plone/controlpanels

Control panel screens for Plone that run in both Plone Aurora and Volto.

It starts with the content types control panel: a list of types, and one page per type with its settings, workflow, fields, behaviors and default layout.
See [plone/aurora#269](https://github.com/plone/aurora/issues/269).

> [!WARNING]
> This package is experimental. Breaking changes may occur without notice.

## How it works

The screens know nothing about the app they run in.

- `ControlPanelsProvider` connects them to the app's router, translations and notifications.
- A driver, such as `ContentTypesDriver`, reads and writes their data.
  Each app provides its own, and `createMockDriver()` serves stories and tests.
- A driver's `capabilities` say what its backend supports.
  The screens hide or disable whatever it can't do yet.

```tsx
import {
  ContentTypesDriverProvider,
  ControlPanelsProvider,
  createMockDriver,
} from '@plone/controlpanels';

const driver = createMockDriver();

export function App({ children }) {
  return (
    <ControlPanelsProvider navigate={navigate} t={t} notify={notify}>
      <ContentTypesDriverProvider driver={driver}>
        {children}
      </ContentTypesDriverProvider>
    </ControlPanelsProvider>
  );
}
```

## Workflow state colors

The screens show each workflow state in a color, for example in the badges of the Workflow tab.
A color is one of the six Quanta color families, so themes and dark mode style it: `gray`, `blue`, `teal`, `green`, `yellow` or `red`.

The color of a state is the first of these that applies:

1. **The site's configuration,** by state id: the `stateColors` of `ContentTypesDriverProvider`.
2. **The backend,** when the driver sets a `color` on the state. plone.restapi doesn't send one yet.
3. **The defaults,** by state id, for the states of the workflows Plone ships with (`DEFAULT_STATE_COLORS`):

   | State                   | Color    |
   | ----------------------- | -------- |
   | `private`               | `red`    |
   | `pending`               | `yellow` |
   | `published`, `external` | `green`  |
   | `visible`               | `teal`   |
   | `internally_published`  | `blue`   |
   | `internal`              | `gray`   |

4. **Who can see items in the state,** so the states of a new workflow get a meaningful color without any configuration: `green` when anyone can, `blue` when members can, and `gray` otherwise.

To give the states of a new workflow their own colors, or to change the colors of the core ones, pass `stateColors`, keyed by state id.
A state id means the same state in every workflow that has it, so `published` changes in all of them.

```tsx
<ContentTypesDriverProvider
  driver={driver}
  stateColors={{ in_print: 'teal', published: 'blue' }}
>
  {children}
</ContentTypesDriverProvider>
```

In Plone Aurora, set them in your add-on's configuration, and Aurora passes them on:

```ts
export default function install(config: ConfigType) {
  config.settings.workflowStateColors = {
    ...config.settings.workflowStateColors,
    in_print: 'teal',
  };
  return config;
}
```

Components get a state's color with `useStateColor()`, and code outside React with `stateColor(state, stateColors)`.

## Translations

The package follows `@plone/plate`'s i18n contract, which is react-i18next's: pass `t` to `ControlPanelsProvider`.
In Plone Aurora that's react-i18next's `t`, and the translations in `src/locales` load with the add-on, which Aurora registers.
Apps on react-intl, such as Volto, pass `translationFromIntl(intl)`, and keep the messages in their own catalogs: the keys are their react-intl message ids.

The English catalog, `src/locales/en/common.json`, is generated from the messages in the code: run `pnpm i18n` after changing them.
The test of the catalogs fails when it's outdated, or when a translation has unknown keys or placeholders.

## Styles in apps without Tailwind

Aurora's Tailwind setup scans this package's source, so it needs nothing else.
Apps without Tailwind, such as Volto, load the compiled stylesheet and wrap the screens in `ControlPanelsScope`:

```jsx
import '@plone/controlpanels/dist/controlpanels.css';
import { ControlPanelsScope } from '@plone/controlpanels';

<ControlPanelsScope>{/* the providers and a screen */}</ControlPanelsScope>;
```

The stylesheet has the classes of this package and of the Quanta components it renders, with Tailwind's reset.
Every rule is scoped to `.plone-controlpanels`, without adding to its specificity, so it styles nothing else on the page.
It has no cascade layers, so the app's own CSS can't win over it.
`ControlPanelsScope` also renders popovers, dialogs and sheets inside the scope.

`pnpm build:css` builds it, and releases build it too.

## Development

```sh
pnpm --filter @plone/controlpanels test
pnpm --filter @plone/controlpanels storybook
```
