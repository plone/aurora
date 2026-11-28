---
myst:
  html_meta:
    "description": "Style the content blocks of Plone Aurora from a theme or add-on, in both the Public UI and the editor"
    "property=og:description": "Style the content blocks of Plone Aurora from a theme or add-on, in both the Public UI and the editor"
    "property=og:title": "Style blocks in a theme"
    "keywords": "Plone Aurora, theme, blocks, CSS, content.css, cascade layers, tokens, classnames"
---

# Style blocks in a theme

This guide explains how a theme or any other add-on styles the content blocks of Plone Aurora.
Block content is styled with plain CSS, not with Tailwind utilities, so your theme can use any CSS approach and any reset.
What you write applies in both the Public UI and the CMSUI editor, so editors see the blocks as visitors do.

## Add a content stylesheet

Create the file {file}`styles/content.css` at the root of your add-on package.
The app loads it in both the Public UI and the CMSUI, inside the `plone-content` cascade layer, after the content styles of the framework packages.

```css
/* my-theme/styles/content.css */
.content-area {
  --block-callout-background: var(--accent-color);
}

.block-listing .block-listing__item {
  border-bottom: 1px solid var(--border);
}
```

Follow the authoring rules in {doc}`/conceptual-guides/add-on-styles-loader`.
In short, don't declare a `@layer` in the file, set every property your rules rely on instead of assuming a reset, and don't target `:root`, `html`, `body`, or bare element selectors.

## Change a token or override a rule

There are two ways to change how a block looks.

Set a token
:   The framework styles read their values from custom properties with a fallback, such as `var(--block-callout-background, var(--muted))`.
    Set the property on `.content-area`, the element that wraps the block content in both user interfaces.
    This is the preferred way, because it keeps working when the framework's rules change.

Override a rule
:   The framework styles are written inside `:where()`, so they have zero specificity.
    Any selector of yours wins over them, such as `.block-callout .block-callout__body`.

```css
/* my-theme/styles/content.css */

/* A token: the code blocks' keyword color. */
.content-area {
  --block-code-token-keyword: #c2185b;
}

/* A rule: more room between the callout's icon and its text. */
.block-callout .block-callout__body {
  gap: 1rem;
}
```

```{note}
Editor-only affordances, such as toolbars, handles, selection outlines, drop lines, and the editor's own controls, aren't block content.
They keep their Tailwind styling, and a theme's {file}`styles/content.css` isn't meant to change them.
```

## Target a block

Every block exposes the same kinds of hooks.
{doc}`/development/block-anatomy` describes them in detail.

| Hook | Example | Use |
|---|---|---|
| Block root | `.block`, `.block-callout`, `.category-text`, `[data-block-type="callout"]` | A block, a kind of block, or a category of blocks. |
| Plate node | `.slate-p`, `.slate-h2`, `.slate-td`, `.slate-a`, `.slate-ploneBlock` | Nested nodes and inline elements, and Plate.js blocks versus Plone blocks. |
| Inner part | `.block-callout__icon`, `.block-listing__item` | Elements inside a block, named `block-<type>__<part>`. |
| Variant | `[data-list-style-type="todo"]`, `[data-align="left"]`, `[data-depth="2"]` | States and options. |

### Plate.js blocks

| Block | Plate node | Parts and variants |
|---|---|---|
| Paragraph and lists | `slate-p` | `block-p__list` (the `ul` or `ol`), `block-p__item` (the `li`, with `data-checked` for done to-do items), `block-p__checkbox` (with `data-state`), `block-p__checkmark`. The root has `data-list-style-type`. |
| Title and headings | `slate-title`, `slate-h1` to `slate-h6` | None. |
| Blockquote | `slate-blockquote` | None. |
| Separator | `slate-hr` | `block-hr__spacer`, `block-hr__line`. |
| Code block | `slate-code_block`, `slate-code_line` | `block-code_block__frame`, `block-code_block__pre`, and the highlighter's `hljs-*` tokens. |
| Table | `slate-table`, `slate-tr`, `slate-th`, `slate-td` | `block-table__scroll`, `block-table__wrapper`, `block-table__table`, `block-table__cell-content`. Cells have `data-border-top`, `-right`, `-bottom`, and `-left` for their bordered sides. |
| Callout | `slate-callout` | `block-callout__body`, `block-callout__icon`, `block-callout__content`. |
| Toggle | `slate-toggle` | `block-toggle__icon`. |
| Columns | `slate-column_group`, `slate-column` | `block-column_group__row`, `block-column_group__column` (each column's wrapper), `block-column__content`. |
| Table of contents | `slate-toc` | `block-toc__item` (with `data-depth`), `block-toc__empty`, `block-toc__highlight`. |
| Inline elements | `slate-code`, `slate-kbd`, `slate-highlight`, `slate-a`, `slate-mention` | Mentions have `data-bold`, `data-italic`, and `data-underline` for their marks. |

### Plone blocks

Plone blocks render inside a `slate-ploneBlock` node, and their root has `block-<type>`.

| Block | Parts and variants |
|---|---|
| Image | `block-image__frame`, `block-image__link`. The root has `data-style-align` and the other style fields as `data-style-*`. |
| Video | `block-video__wrapper` (with `data-align`), `block-video__figure`, `block-video__inner`, `block-video__invalid`. |
| Teaser | `block-teaser__item`, `block-teaser__image`, `block-teaser__content`, `block-teaser__title`, `block-teaser__description`. |
| Listing | `block-listing__headline`, `block-listing__item` (with `data-variation="summary"` in the summary variation), `block-listing__image`, `block-listing__body`, `block-listing__title`, `block-listing__description`, `block-listing__empty`. |
| Maps | `block-maps__frame`, `block-maps__iframe`. |

## Tokens

Set these custom properties on `.content-area`.
Each value falls back to the default shown when it isn't set.

### Layout

`@plone/layout` lays out the blocks, in {file}`packages/layout/styles/content.css`.
The content is a stack: each block is full width and flush at the top, its content is at most `--block-width` wide, and the gap after it is the block's own bottom padding, so a block's background includes it.
Blocks don't set outer margins or padding; they set the value of their gap instead.

| Token | Default | What it sets |
|---|---|---|
| `--narrow-container-width`, `--default-container-width`, `--layout-container-width` | From `@plone/theming` | The widths of the `narrow`, `default`, and `layout` block widths, and of the `text` and `heading` categories. |
| `--block-spacing` | `calc(var(--spacing) * 5)` | The default gap after a block. |
| `--block-spacing-after` | `--block-spacing` | The gap after one block. Set it on a block selector, such as `.block-callout`, to change one kind of block. Blocks in the `heading` category use `calc(var(--spacing) * 14)`, the `action` category `calc(var(--spacing) * 8)`, and separators, the block before them, floated images and the last block nested in a container `0`. A block doesn't pass it on to the blocks nested in it. |
| `--block-background` | `transparent` | The block's background, including its gap. Set it on a block selector. A block doesn't pass it on to the blocks nested in it. |
| `--block-float-max-size` | `66%` | The largest width of a left or right aligned image. |
| `--gutter` | `calc(var(--spacing) * 4)` | The room on both sides of the page: of the header and footer sections and of each block of the content. Set it on `.app-slot`, or on `:root`. In the editor, the editor's own padding is the gutter. |
| `--content-spacing` | `calc(var(--spacing) * 8)` | The room between the content and the header and footer, in the Public UI. Set it on `.app-slot`, or on `:root`. |

`--block-width` holds a block's computed width, and `--block-size`, `--block-margin`, and `--block-float` hold the image block's style fields.
The framework sets them; don't set them in a theme.

### Plate.js blocks

| Token | Default | What it sets |
|---|---|---|
| `--block-separator-color` | `var(--muted)` | The separator's line. |
| `--block-code-background` | `var(--muted)` | Inline code. |
| `--block-kbd-background` | `var(--muted)` | Keyboard input. |
| `--block-highlight-color` | `Mark` | Highlighted text. |
| `--block-mention-background` | `var(--muted)` | Mentions. |
| `--block-code-block-background` | `var(--muted)` at 50% | The code block's frame. |
| `--block-table-border-color` | `var(--border)` | Table cell borders. |
| `--block-callout-background` | `var(--muted)` | The callout's box, unless the callout has its own color. |
| `--block-callout-icon-font-family` | An emoji font stack | The callout's icon. |
| `--block-toc-highlight-color` | `var(--brand)` | The highlight on a heading after jumping to it from the table of contents, at 13%. |
| `--block-title-spacing-after` | `calc(var(--spacing) * 8)` | The gap after the page title. |
| `--block-h1-spacing-before` to `--block-h6-spacing-before` | `calc(var(--spacing) * 12)`, `* 10`, `* 8`, `* 6` for `h4` to `h6` | The room before a heading, set as the gap after the block that precedes it. `h5` and `h6` follow `h4`. |

The code block's syntax colors are tokens too.
Their defaults are GitHub's light theme.

| Token | Default | Highlighter classes |
|---|---|---|
| `--block-code-token-keyword` | `#d73a49` | `hljs-keyword`, `hljs-doctag`, `hljs-template-tag`, `hljs-template-variable`, `hljs-type` |
| `--block-code-token-attribute` | `#005cc5` | `hljs-attr`, `hljs-attribute`, `hljs-literal`, `hljs-meta`, `hljs-number`, `hljs-operator`, `hljs-selector-attr`, `hljs-selector-class`, `hljs-selector-id`, `hljs-variable` |
| `--block-code-token-string` | `#032f62` | `hljs-string`, `hljs-regexp`, strings inside `hljs-meta` |
| `--block-code-token-title` | `#6f42c1` | `hljs-title` |
| `--block-code-token-name` | `#22863a` | `hljs-name`, `hljs-quote`, `hljs-selector-tag`, `hljs-selector-pseudo` |
| `--block-code-token-comment` | `#6a737d` | `hljs-comment`, `hljs-code`, `hljs-formula` |
| `--block-code-token-symbol` | `#e36209` | `hljs-symbol` |
| `--block-code-token-bullet` | `#735c0f` | `hljs-bullet` |
| `--block-code-token-section` | `#005cc5` | `hljs-section` |
| `--block-code-token-addition`, `--block-code-token-addition-background` | `#22863a`, `#f0fff4` | `hljs-addition` |
| `--block-code-token-deletion`, `--block-code-token-deletion-background` | `#b31d28`, `#ffeef0` | `hljs-deletion` |

### Theme values

The framework styles also read the theme's general values, with Tailwind's defaults as fallbacks, so a theme without Tailwind can set them too.
These include colors such as `--muted`, `--muted-foreground`, `--primary`, `--border`, `--accent` (a subtle hover fill), `--brand` (the site's brand color), and `--ring`, the spacing unit `--spacing`, the type scale such as `--text-sm` and `--text-sm--line-height`, font weights such as `--font-weight-bold`, the radii `--radius-sm` and `--radius-md`, and `--font-mono`.

## Give code blocks dark colors

This theme gives code blocks dark colors when the visitor prefers a dark color scheme, in both the Public UI and the editor.

```css
/* my-theme/styles/content.css */
@media (prefers-color-scheme: dark) {
  .content-area {
    --block-code-block-background: #1e293b;
    --block-code-token-keyword: #ee6960;
    --block-code-token-attribute: #6596cf;
    --block-code-token-string: #3593ff;
    --block-code-token-title: #a77bfa;
    --block-code-token-name: #36a84f;
    --block-code-token-symbol: #c3854e;
    --block-code-token-section: #61a5f2;
    --block-code-token-addition: #ceead5;
    --block-code-token-addition-background: #3c5743;
    --block-code-token-deletion: #e7c7cb;
    --block-code-token-deletion-background: #473235;
  }

  .block-code_block .block-code_block__pre {
    color: #e2e8f0;
  }
}
```

## Check your theme without Tailwind

The framework styles don't rely on Tailwind's preflight or on any other reset.
If your theme ships its own reset, load it into the `base` layer, for example with `@import 'modern-normalize.css' layer(base);`, so it stays below the content styles.
A reset loaded without a layer wins over the content styles and can change how blocks look.
