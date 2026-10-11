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
    <ControlPanelsProvider
      navigate={navigate}
      translate={translate}
      notify={notify}
    >
      <ContentTypesDriverProvider driver={driver}>
        {children}
      </ContentTypesDriverProvider>
    </ControlPanelsProvider>
  );
}
```

## Development

```sh
pnpm --filter @plone/controlpanels test
pnpm --filter @plone/controlpanels storybook
```
