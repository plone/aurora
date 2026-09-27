# `@plone/icons`

The Quanta icon set for Plone Aurora.

This package provides:

- the raw Quanta icons as SVG files
- a ready-to-use React component for each icon
- the `Icon` component that wraps an SVG and gives it consistent sizing, color and accessibility attributes
- the TypeScript declarations for `*.svg?react` imports
- `PloneSVGRVitePlugin`, a Vite plugin that turns an SVG file into a React component wrapped in `Icon`

It has no dependency on any other Plone package, so you can use it anywhere you need the icons.

## Installation

```shell
pnpm add @plone/icons
```

## Usage

### Icons as React components

Every icon is available as a React component named `<Name>Icon`.
They are regular components, so they don't need any extra bundler configuration.

```tsx
import { ChevronupIcon, ChevrondownIcon } from '@plone/icons';

const MyComponent = (props) => (
  <button aria-label="Unfold/Collapse">
    {props.isOpen ? <ChevronupIcon /> : <ChevrondownIcon />}
  </button>
);
```

You can pass any prop that the `Icon` component accepts:

```tsx
import { AddIcon } from '@plone/icons';

const MyComponent = () => <AddIcon size="xl" color="--quanta-sapphire" />;
```

The package is marked as side-effect free, so your bundler only includes the icons you import.

### The `Icon` component

`Icon` wraps any SVG element.
Without an `aria-label`, the icon is decorative and hidden from assistive technology (`aria-hidden="true"`).
With an `aria-label`, it's exposed as an image with that label.

```tsx
import { Icon, type IconProps } from '@plone/icons';

const MyIcon = (props: Omit<IconProps, 'children'>) => (
  <Icon {...props}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M13 3H11V11H3V13H11V21H13V13H21V11H13V3Z" />
    </svg>
  </Icon>
);
```

`size` accepts `2xs`, `xs`, `sm`, `base`, `lg`, `xl`, `2xl` and `3xl`.
`color` accepts any CSS color, or the name of a CSS custom property starting with `--`.

### Raw SVG files

The raw SVG files are available under `@plone/icons/svg/`.

```tsx
import addSVG from '@plone/icons/svg/add.svg';

const MyComponent = () => <img src={addSVG} alt="" />;
```

### SVG files as React components with the Vite SVGR plugin

`PloneSVGRVitePlugin` configures `vite-plugin-svgr` so that importing an SVG file with the `?react` suffix gives you a React component.
The SVG is optimized and wrapped in the `Icon` component.
Add the plugin to your `vite.config.ts`:

```ts
import { PloneSVGRVitePlugin } from '@plone/icons/vite-plugin-svgr';

export default defineConfig({
  plugins: [
    PloneSVGRVitePlugin(),
    // (...other plugins)
  ],
  // (...more Vite config)
});
```

Then import any SVG with `?react`:

```tsx
import AddSVG from '@plone/icons/svg/add.svg?react';

const MyComponent = () => <AddSVG size="xl" />;
```

To get the TypeScript types for `*.svg?react` imports, add `@plone/icons/svg` to the `types` of your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@plone/icons/svg"]
  }
}
```

## Adding an icon

1. Add the SVG file to `src/svg/`, using a kebab-case name, for example `src/svg/my-icon.svg`.
2. Add its React counterpart to `src/icons/`, for example `src/icons/MyiconIcon.tsx`, following the pattern of the existing icons: it renders the SVG markup inside `Icon` and accepts `IconPropsWithoutChildren`.
3. Export it from `src/icons/index.ts`.

Keep the SVG and the React component names aligned.
