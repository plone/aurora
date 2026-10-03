---
myst:
  html_meta:
    "description": "This upgrade guide lists all breaking changes in @plone/components, and explains the necessary steps to upgrade your add-on to use the latest version."
    "property=og:description": "This upgrade guide lists all breaking changes in @plone/components, and explains the necessary steps to upgrade your add-on to use the latest version."
    "property=og:title": "@plone/components upgrade guide"
    "keywords": "@plone/components, Plone, components, frontend, React, upgrade, guide"
---

(plone-components-upgrade-guide)=

# `@plone/components` upgrade guide

This is the upgrade guide for `@plone/components`.
It lists all breaking changes in the package, and explains the necessary steps to upgrade your add-on to use the latest version.

## 5.0.0

`@plone/components` is now a basic-only, headless component library.
The Quanta design system, its widgets, and the icon set have moved to two new packages, `@plone/quanta` and `@plone/icons`.

### Quanta components moved to `@plone/quanta`

The Tailwind-styled Quanta components moved out of `@plone/components` into the new `@plone/quanta` package.

```diff
- import { … } from '@plone/components/quanta';
+ import { … } from '@plone/quanta';
```

This keeps `@plone/components` focused on the basic, headless set, and lets the Quanta design system evolve and ship independently, with its own Storybook.

### Widgets moved to `@plone/quanta`

`SizeWidget`, `AlignWidget`, and `WidthWidget` moved from `@plone/components` to `@plone/quanta`, together with the rest of the Quanta components.

```diff
- import { SizeWidget, AlignWidget, WidthWidget } from '@plone/components';
+ import { SizeWidget, AlignWidget, WidthWidget } from '@plone/quanta';
```

### CSS-based `Quanta*` wrappers removed

The CSS-based `QuantaTextField`, `QuantaSelect`, and `QuantaTextAreaField` root exports, and their `styles/quanta/{Select,TextField}.css` overrides, were removed.
Use the Tailwind-based Quanta components instead.

```diff
- import { QuantaTextField, QuantaSelect, QuantaTextAreaField } from '@plone/components';
+ import { TextField, Select, TextAreaField } from '@plone/quanta';
```

This removes a CSS-based approximation of the Quanta look in favor of the real Tailwind Quanta components, so there's a single source of truth for Quanta styling.

### Icons moved to `@plone/icons`

The icon set, the `Icon` component, the `*.svg?react` types, and the `PloneSVGRVitePlugin` Vite plugin moved to the new `@plone/icons` package.

```diff
- import { Icon, type IconProps } from '@plone/components';
- import { AddIcon, … } from '@plone/components/Icons';
- import X from '@plone/components/icons/<name>.svg?react';
- import { PloneSVGRVitePlugin } from '@plone/components/vite-plugin-svgr';
+ import { Icon, type IconProps } from '@plone/icons';
+ import { AddIcon, … } from '@plone/icons';
+ import X from '@plone/icons/svg/<name>.svg?react';
+ import { PloneSVGRVitePlugin } from '@plone/icons/vite-plugin-svgr';
```

Update any local `types.d.ts` or `tsconfig.json` `types`/`include` entries that reference `@plone/components/icons` or `components/src/icons.d.ts` to point at `@plone/icons/svg` instead.

This makes the icon set, which has no Plone dependencies, independently publishable and reusable, and keeps `@plone/components` free of icon-pipeline concerns.

If your project uses `@plone/quanta` or `@plone/icons` *without* `@plone/components`' basic CSS, import `@plone/icons/icons.css` to get the base `Icon` styles (color inherited from text, `inline-block`, no pointer events):

```diff
+ import '@plone/icons/icons.css';
```

### Quanta styles, fonts, and Tailwind `@source` path changed

The Quanta CSS, typography, and fonts moved from `@plone/components` to `@plone/quanta`.
`@plone/components/dist/quanta.css` and `@plone/components/dist/fonts/*` no longer exist; use `@plone/quanta/dist/quanta.css` and `@plone/quanta`'s fonts instead.

If your Tailwind entry file scans `@plone/components` for Quanta classes, update it to scan `@plone/quanta` instead:

```diff
- @source '../node_modules/@plone/components/dist/quanta';
+ @source '../node_modules/@plone/quanta/dist';
```

## 4.0.0

### Refactored `Icon` component

The `Icon` component has been refactored to match the Tailwind naming conventions for icon sizes.
It still uses the `size` prop, but the possible values have changed.

The following sizes have been removed:
- `XXS`
- `XS`
- `S`
- `M`
- `L`
- `XL`
- `XXL`

The following sizes have been added:
- `2xs`
- `xs`
- `sm`
- `base`
- `lg`
- `xl`
- `2xl`
- `3xl`

The size is determined now by the calculation of using the CSS custom property `--quanta-icon-size`, which is mapped to the `--spacing` CSS custom property by default.
By default in Tailwind, `--spacing` is set to `0.25rem` (4px), so the icon sizes are calculated as follows:
- `2xs`: `0.75rem` (12px)
- `xs`: `1rem` (16px)
- `sm`: `1.25rem` (20px)
- `base`: `1.5rem` (24px)
- `lg`: `1.75rem` (28px)
- `xl`: `2rem` (32px)
- `2xl`: `2.25rem` (36px)
- `3xl`: `2.5rem` (40px)

The default value is `base`, which is `24px`.
The size can be changed by setting the `--quanta-icon-size` CSS custom property to a different value.
