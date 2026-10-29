# AGENTS.md

This file applies only to `packages/layout` and its subdirectories.

## What This Package Is

- `@plone/layout` provides **shared structural layout elements** for Plone Aurora.
- It is consumed by both `@plone/cmsui` (editor UI) and `@plone/publicui` (public-facing pages).
- It contains: page header, footer, breadcrumbs, block renderer (`RenderBlocks`, `SomersaultRenderer`), toast notifications, and slot configuration.

## Package Model

- **Blocks rendering** (`blocks/`): `RenderBlocks` and `SomersaultRenderer` orchestrate how Somersault blocks are rendered on a page.
- **Components** (`components/`): structural UI elements (header, footer, breadcrumbs, toast).
- **Config** (`config/`): slot definitions (`slots.ts`), toast config (`toast.ts`), and layout settings (`settings.ts`).
- **Styles** (`styles/`): CSS for each layout section, organized by zone (`header.css`, `footer.css`, `content-area.css`, `publicui.css`).
  - `content.css` holds the block model's spatial relationships (category widths, spacing between blocks, nested blocks). The app loads it in both the Public UI and the CMSUI editor, inside the `plone-content` cascade layer, so blocks are laid out the same in both. Follow the authoring rules in `docs/conceptual-guides/add-on-styles-loader.md`: no `@layer`, and selectors inside `:where()`.
  - `content.css` lays the blocks out as a stack: each block full width and flush at the top, with the gap after it as the block's own bottom padding (`--block-spacing-after`), so a block's background (`--block-background`) includes it. Next step, once blocks have a background style field: cancel the gap before a block with a different background, and give a block with a background the same room at the top. Block packages set the values, never outer margins or padding. The frame styles apply the `--gutter` and `--content-spacing` tokens; themes set their values.
- **Containers**: the frame styles make `#header`, `#footer` and `.content-area` the `header`, `footer` and `content` inline-size containers. Themes write their responsive rules as container queries on them, so each region follows its own width: the content area, for example, is narrower when the toolbar is shown. These containers exist in the Public UI only.
- **Page titles**: views without blocks render `components/DocumentTitle`, which uses the title block's markup, so every page has one `h1` styled like the title block.
- **Quanta in the Public UI**: the toolbar, and `Link` in `EventDetails` and `LinkView`, are `@plone/quanta` components. They need the Quanta palette and the `@source` entries in `@plone/theming`, and the Quanta colors import in `styles/publicui.css`. Keep them until those components are replaced.
- Storybook is configured under `.storybook/`.

## Editing Rules

- Do not add **app-specific or CMS-specific logic** here. Layout components must work equally in both `cmsui` and `publicui` contexts.
- Keep block renderer logic in `blocks/` — do not spread rendering concerns into component files.
- When adding a new layout zone or structural component, add a corresponding CSS file in `styles/`.
- Write Storybook stories for new visual components.
- Do not add data-fetching logic here; layout components receive data via props or slots.

## Validation

```sh
pnpm --filter @plone/layout test --run
pnpm --filter @plone/layout check:ts
```

For Storybook:

```sh
pnpm --filter @plone/layout storybook
```
