# `@plone/quanta`

[![NPM](https://img.shields.io/npm/v/@plone/quanta.svg)](https://www.npmjs.com/package/@plone/quanta)
[![Build Status](https://app.readthedocs.org/projects/plone-quanta/badge/?version=latest)](https://plone-quanta.readthedocs.io/latest/)

The Quanta design system components for Plone Aurora.

This package provides the React components, form widgets, styles and fonts of the Quanta design system, used to build the Plone Aurora CMS UI.
The components are built on [React Aria Components](https://react-aria.adobe.com/) and styled with [Tailwind CSS](https://tailwindcss.com/).
The React Aria Components documentation applies to all the components in this package.

Icons come from the [`@plone/icons`](../icons/README.md) package.

## Storybook / Demo

You can find the self-documented Storybook in:

https://plone-quanta.readthedocs.io/latest/

## Installation

```shell
pnpm add @plone/quanta
```

## Usage

All the components are available as named exports from the package root:

```tsx
import { Button, TextField } from '@plone/quanta';

const MyComponent = () => (
  <>
    <TextField label="Username" />
    <Button variant="primary">Save</Button>
  </>
);

export default MyComponent;
```

The pickers `SizePicker`, `AlignPicker` and `WidthPicker` are exported from the package root as well. They are controls; the form widgets that use them live in `@plone/cmsui`.

## Tailwind requirement

The Quanta components are styled with Tailwind utility classes, so the consuming app must build Tailwind CSS and scan this package for the classes it uses.
Add the package's `dist` folder as a Tailwind source, and enable the `tailwindcss-react-aria-components` and `tailwindcss-animate` plugins, as `@plone/cmsui` does in `styles/cmsui.css`:

```css
@plugin 'tailwindcss-react-aria-components';
@plugin 'tailwindcss-animate';

@source '../node_modules/@plone/quanta/dist';
@source '../node_modules/@plone/icons/dist';
```

Adjust the `@source` paths so they're relative to your CSS file.

Consumers must also import `@plone/icons/icons.css` for the base `Icon` styles (see below), so that icon sizes from the `@source '@plone/icons'` scan and the base rules both apply.

## Styles

The Quanta color tokens, theme, typography, fonts and the few component styles that aren't expressed as Tailwind utilities ship as a CSS bundle:

```js
import '@plone/quanta/dist/quanta.css';
```

The single source files are also available under `@plone/quanta/src/styles/`, for example:

```css
@import '@plone/quanta/src/styles/Popover.css';
```

### CSS layers

This package uses CSS layers to scope its styles.
Tailwind 4 already leverages CSS layers.
This package extends the Tailwind defined layers:

```
@layer theme, base, components, plone-components, utilities, custom;
```

The `plone-components` layer scopes the styles included in this package.
The final `custom` layer allows customizations and overrides.

## Development

The components are developed in isolation in Storybook:

```shell
pnpm --filter @plone/quanta storybook
```

Run the checks from the repository root:

```shell
pnpm --filter @plone/quanta build
pnpm --filter @plone/quanta check:ts
pnpm --filter @plone/quanta test --run
pnpm --filter @plone/quanta lint
```
