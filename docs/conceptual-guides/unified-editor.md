---
myst:
  html_meta:
    "description": "How the unified block editor works in Plone Aurora"
    "property=og:description": "How the unified block editor works in Plone Aurora"
    "property=og:title": "The unified block editor"
    "keywords": "Plone Aurora, editor, Plate.js, blocks, Slate, Somersault, frontend, Plone"
---

# The unified block editor

Plone Aurora replaces the classic block editor (the _Pastanaga editor_ used in Volto) with a single [Plate.js](https://platejs.org/) editor instance that owns the entire page content.
This document explains the architecture behind that editor, how content is stored, and how existing Plone blocks keep working inside it.

```{warning}
The unified editor is under active development.
The internal names and data shapes described here (including the `__somersault__` key) may still change before Plone Aurora reaches a stable release.
```

## Motivation

In Volto, the editing surface is split across two different models.
Each text-based block instantiates its own [Slate](https://docs.slatejs.org/) editor, while non-text blocks (image, listing, custom blocks, and so on) live outside Slate and are managed by the block engine.
This split has structural costs: two mental models and rendering pipelines, selection state that is hard to coordinate across blocks, awkward keyboard navigation between blocks, and a per-instance performance overhead in large documents.

Plone Aurora unifies both models into one editor tree.
A single Plate editor holds the whole page, text is edited as native Plate blocks, and existing Plone blocks are mounted as nodes inside the same tree.
There is no longer a separation between "editor text content" and "content blocks".

## The single editor tree

The editor is provided by the `@plone/plate` package, Plone Aurora's Plate.js-based block editor.
One editor instance is initialized at the page level and renders every block, so the document is a single tree:

```text
Page content
└── Plate editor
    ├── title        (native Plate block)
    ├── p            (native Plate block)
    ├── ploneBlock   (wrapped image block)
    ├── ploneBlock   (wrapped listing block)
    └── ...
```

Nodes come in two kinds:

Native Plate blocks
:   Text-based content such as the document `title`, paragraphs (`p`), and headings.
    These are edited directly by Plate using the Slate data model.

Wrapped Plone blocks
:   Any registered block (image, listing, teaser, or a custom add-on block) mounted as a node of type `ploneBlock`.
    A generic adapter plugin renders these nodes by delegating to the block's existing `edit` and `view` components from the configuration registry, so the block's schema, configuration, and components remain unchanged.

Because both kinds share one editor, the document has a single selection model, a unified undo/redo stack, and consistent keyboard navigation across all blocks.

## The Plone block adapter

The bridge between Plate and the Plone block ecosystem is the _Plone block adapter_ plugin (`PloneBlockAdapterPlugin`), which registers a void element node of type `ploneBlock`.

For each wrapped node, the adapter:

- Reads the node's `@type` and looks up the matching block in `config.blocks.blocksConfig`.
- Renders the block's existing `edit` component in the editor (or its `view` component in the renderer), passing the familiar block props: `data`, `block`, `selected`, `setBlock`, `onChangeBlock`, `onSelectBlock`, and `blocksConfig`.
- Maps changes from the block back into the Plate tree, keeping the node's data (everything except the internal `type`, `id`, and `children` fields) in sync with the block's data.

A companion keyboard plugin handles caret movement in and out of these void nodes, so pressing {kbd}`Enter`, {kbd}`ArrowUp`, or {kbd}`ArrowDown` moves between wrapped blocks and native text blocks as a user would expect.

The consequence is that **existing blocks require no changes**.
Add-on authors keep writing blocks against the standard Plone block API and schema; the adapter is what makes them native Plate nodes.

## Data model

The unified content is stored inside the standard `blocks` mapping, under a single fixed key, `__somersault__` (`Somersault` is the internal codename for the unified editor).

```json
{
  "blocks": {
    "__somersault__": {
      "@type": "__somersault__",
      "value": [
        {
          "type": "title",
          "children": [{ "text": "Welcome to Plone" }]
        },
        {
          "type": "ploneBlock",
          "@type": "image",
          "url": "/image-1.jpg",
          "alt": "Image-1.jpg",
          "blockWidth": "default",
          "children": [{ "text": "" }]
        },
        {
          "type": "p",
          "children": [{ "text": "" }]
        }
      ]
    }
  }
}
```

The `__somersault__` entry follows the same shape as any other block: it has an `@type` and a `value`.
The `value` holds the entire Plate editor value as an ordered array of nodes:

- **Native text nodes** use a Plate `type` (`title`, `p`, and so on) and Slate-style `children`.
- **Wrapped Plone blocks** use `type: "ploneBlock"`, carry the original block data verbatim (`@type` and all its fields), add a computed `blockWidth`, and include an empty `children` array because the node is a void element.

```{note}
The wrapped-block node uses `type: "ploneBlock"`.
The original PLIP proposal used a placeholder `type` of `"unknown"`; the implemented adapter uses `ploneBlock` (the value of `PLONE_BLOCK_TYPE`).
```

## Where content is normalized

Plone content authored with the classic editor does not yet contain a `__somersault__` key, so Plone Aurora builds it.
Normalization is a **server-side concern**: the app assembles and normalizes the unified value once, on the server, and hands the editor and renderer already-migrated data.

This runs in the request middleware ([`app/middleware.server.ts`](https://github.com/plone/aurora/blob/main/apps/aurora/app/middleware.server.ts)), which calls `migrateContent` on every fetched content object.
The process is:

1. **Skip if already migrated.** If the content already has a `__somersault__` block, it is returned untouched. This keeps the operation idempotent and lets migrated and legacy content coexist during the transition.
2. **Assemble the value.** The blocks are read in the order given by `blocks_layout.items`, and each block is converted into one or more Plate nodes by a chain of registered `somersaultBlockMigration` utilities — for example mapping a `title` block to the metadata title, passing through legacy Slate `value` arrays, and wrapping any registered block into a `ploneBlock` node.
3. **Normalize the whole value.** A chain of `somersaultMigration` utilities then runs over the assembled value to convert legacy Slate shapes to Plate standards: bold, italic, strikethrough, links, lists, and block widths.

The individual conversions are pure helpers exported from `@plone/plate/migrations`, so the same logic can run in an upgrade step or a one-time content transformation rather than only at request time.

The one case the server cannot cover is content pasted directly out of a legacy `volto-slate` editor.
That is handled on the client by a single paste plugin (`LegacyPastePlugin`), wired into the editor presets only, which runs the same static migrations on the incoming fragment.

## Editor and renderer presets

`@plone/plate` composes its behavior into _presets_ — named editor configurations for a given use case.
Two presets back the unified editor:

`somersault-editor`
:   The editing configuration used in the CMS UI.
    It includes the block editor kit, the `title` block, the Plone block adapter, and the keyboard plugin.
    It is consumed by `@plone/cmsui` to power the `add` and `edit` routes through its `BlocksEditor` component, which reads and writes the `__somersault__` block.

`somersault-renderer`
:   A read-only configuration used to display content.
    It is consumed by `@plone/layout` through its `SomersaultRenderer` component, which renders the `__somersault__` value for the public view.

The `title` node is kept in sync with the content's `title` metadata field, so editing the title in the document and editing it as metadata stay consistent.

## Backward compatibility

The design preserves the existing block contract:

- Block schemas and their `edit`/`view` components remain unchanged.
- Slate and Plate share the same underlying data model, so legacy text requires only structural transformation, not a semantic rewrite.
- The migration is additive: the `__somersault__` key is derived from the existing blocks while the original data stays in place, so the change is transparent to add-ons.

```{seealso}
For the full rationale, the migration strategy, and the roadmap, see the PLIP [Unified Block Editor in Plone 7 using Plate.js](https://github.com/plone/aurora/issues/50).
For how the classic Volto editor differs from Plone Aurora more broadly, see {doc}`aurora-vs-volto-differences`.
```
