---
myst:
  html_meta:
    "description": "How to add a migration that shapes content for the unified editor in Plone Aurora"
    "property=og:description": "How to add a migration that shapes content for the unified editor in Plone Aurora"
    "property=og:title": "Add an editor content migration"
    "keywords": "Plone Aurora, editor, Plate.js, Somersault, migration, blocks, utilities, server"
---

# Add an editor content migration

The {doc}`unified editor <../conceptual-guides/unified-editor>` stores the whole page as a single Plate value under the `__somersault__` key.
When content authored with the classic editor is fetched, Plone Aurora assembles and normalizes that value on the server.
This guide shows how to extend that process with your own migrations, for example to support a custom legacy block or to normalize a legacy text shape.

```{seealso}
For the architecture behind the editor and where this process runs, see {doc}`../conceptual-guides/unified-editor`.
For the general utility API used here, see {doc}`register-and-retrieve-utilities`.
```

## The two migration utility types

Building the editor value is a two-phase pipeline, and there is one migration type for each phase.
Legacy content is stored as a **map of blocks** plus a separate **layout order** (`blocks_layout.items`), but the editor needs a **single flat, ordered list of nodes**.
`migrateContent` runs the phases strictly in order:

1. **Assembly** — all `somersaultBlockMigration` utilities run first, one pass per legacy block in `blocks_layout.items` order, producing the assembled `__somersault__` value (the flat node list).
2. **Normalization** — only then do all `somersaultMigration` utilities run, each over that **entire assembled value**.

So block migrations never see the final value, and value migrations never see individual blocks — a value migration always operates on the complete list already produced by the assembly phase.

`somersaultBlockMigration` — the **assembly** phase
:   Answers the question: _"given this stored block, what node(s) should appear in the editor, and where?"_
    It runs once per legacy block, in `blocks_layout.items` order, and works at the **block boundary**: it receives one block (with its `blockId` and the full `content`) and returns the Plate node(s) that block becomes.
    This is where the block map turns into an ordered node list.

`somersaultMigration` — the **normalization** phase
:   Answers the question: _"given nodes that are already in the tree, is their internal shape correct?"_
    It runs once over the **whole assembled value**, ignores block boundaries, and fixes **cross-cutting** shapes that can appear inside any node — regardless of which block produced them.
    The built-in ones convert legacy Slate shapes (bold, italic, strikethrough, links, lists, block widths) to Plate standards.

### Which one should I write?

Use the phase distinction to decide:

- Write a **block migration** when your concern is a **whole block** — a block type that has no representation in the editor yet, or one that should map to a native Plate node instead of a wrapped block. You need the block boundary (its `@type`, `blockId`, or content metadata) to do the job.
- Write a **value migration** when your concern is a **shape inside nodes** that should be fixed **everywhere it occurs** — a legacy mark, an inline element, an attribute — independent of which block it came from. You only need the nodes, not the blocks.

A rule of thumb: if you find yourself branching on `block['@type']`, you want a block migration. If you find yourself walking the node tree looking for a `type` or a property, you want a value migration.

Both run server-side only. `migrateContent` is idempotent: if the content already has a `__somersault__` block, it is returned untouched.

### The default core pipeline

The migrations Plone Aurora registers by default (in [`migrations.server.ts`](https://github.com/plone/aurora/blob/main/apps/aurora/app/config/server/migrations.server.ts)) are a good illustration of the two phases.
They run in this registration order.

**Assembly** — the `somersaultBlockMigration` utilities, offered every block in `blocks_layout.items` order:

1. `somersaultBlockMigrationTitle` — turns the `title` block into a native `title` node, using the content's `title` metadata as its text.
2. `somersaultBlockMigrationLegacyValue` — passes through the `value` array of a legacy text block (already Slate nodes) into the editor value.
3. `somersaultBlockMigrationUnknown` — wraps any other registered block (image, listing, teaser, custom blocks) into a `ploneBlock` node, preserving its data and computing its `blockWidth`.

Because each block is offered to all three, and each returns `[]` when it does not apply, every block is handled by exactly one of them.
The result is the assembled `__somersault__` value.

**Normalization** — the `somersaultMigration` utilities, each run over that whole assembled value, in order:

1. `somersaultMigrationLegacyBold`
2. `somersaultMigrationLegacyItalic`
3. `somersaultMigrationLegacyStrikethrough`
4. `somersaultMigrationLegacyLinks`
5. `somersaultMigrationLegacyLists`
6. `somersaultMigrationBlockWidths`

Each converts one legacy Slate shape (bold, italic, strikethrough, links, lists, block widths) to its Plate standard, wherever it appears in the tree.
Your own migrations are appended to these chains, so by default they run after the core ones.

## Where to register migrations

Migrations are registered from server-side configuration.
The built-in ones live in [`app/config/server/migrations.server.ts`](https://github.com/plone/aurora/blob/main/apps/aurora/app/config/server/migrations.server.ts), which is installed from `app/config/server.server.ts`.
You can add your own there, if you are working in Plone Aurora core, or register them from an add-on's server-side configuration.

Because utilities registered later under the same `name` override earlier ones, an add-on can also replace a built-in migration by reusing its `name`.

## Add a `somersaultBlockMigration`

A block migration converts one legacy block into one or more Plate nodes.
It must return an array — return `[]` for blocks it does not handle, since every registered block migration is offered every block.

The utility method receives:

- `block` — the block's data (`Record<string, unknown>`), including its `@type`.
- `blockId` — the block's key in `blocks`.
- `content` — the full content object, useful for reading metadata.

For example, to convert a legacy `description` block into a native Plate paragraph:

```ts
import config from '@plone/registry';
import type { SomersaultBlockMigrationArgs } from '../types';

config.registerUtility({
  name: 'somersaultBlockMigrationDescription',
  type: 'somersaultBlockMigration',
  method: ({ block }: SomersaultBlockMigrationArgs) =>
    block['@type'] === 'description'
      ? [
          {
            type: 'p',
            children: [
              { text: typeof block.text === 'string' ? block.text : '' },
            ],
          },
        ]
      : [],
});
```

```{note}
Registered Plone blocks do not need a dedicated block migration.
The built-in `somersaultBlockMigrationUnknown` already wraps any block present in `blocksConfig` into a `ploneBlock` node, preserving its data.
Write a block migration only for legacy shapes that are not registered blocks, or when you need to produce a native Plate node instead of a wrapped block.
```

## Add a `somersaultMigration`

A value migration normalizes the assembled value.
It receives the full `value` (and the `content`), and returns the transformed value.
Keep it a pure function of its input.

For example, to convert a legacy `highlight` mark node into a Plate `highlight` text property:

```ts
import config from '@plone/registry';
import type { Value } from '@plone/plate/components/editor';
import type { SomersaultMigrationArgs } from '../types';

const migrateHighlight = (value: Value): Value =>
  value.map((node) => {
    if ((node as any).type === 'highlight') {
      return {
        ...node,
        children: (node as any).children.map((child: any) => ({
          ...child,
          highlight: true,
        })),
      };
    }
    return node;
  });

config.registerUtility({
  name: 'somersaultMigrationHighlight',
  type: 'somersaultMigration',
  method: ({ value }: SomersaultMigrationArgs) => migrateHighlight(value),
});
```

For non-trivial transformations, prefer a reusable pure helper (as the built-in migrations do with `@plone/plate/migrations`) so the same logic can also run in an upgrade step or a one-time content transformation, not only at request time.

## Order matters

Utilities of the same type run in registration order:

- Block migrations are each offered every block; a block can be picked up by more than one, and their returned nodes are appended in order.
- Value migrations are chained, each receiving the output of the previous one, so a later normalizer sees the result of the earlier ones.

Register your migrations after the built-in ones if they depend on the standard normalization having already run.
