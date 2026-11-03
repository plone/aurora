# Slate → Plate legacy migrations

This package ships pure, static helpers that convert legacy Slate content into
Plate-standard shapes. In the desired architecture **normalization is a
server-side concern**: the host app runs these helpers once, on the server, and
hands the editor/renderer already-migrated data.

## Where normalization actually runs

- **Server (source of truth).** In Aurora the request middleware assembles the
  unified Somersault value from the individual legacy blocks and runs the static
  migrations before the content reaches the app:
  - [../../apps/aurora/app/middleware.server.ts](../../apps/aurora/app/middleware.server.ts)
    → `migrateContent(...)`
  - [../../apps/aurora/app/config/server/content-migrations.server.ts](../../apps/aurora/app/config/server/content-migrations.server.ts)
  - [../../apps/aurora/app/config/server/migrations.server.ts](../../apps/aurora/app/config/server/migrations.server.ts)
    registers one `somersaultMigration` utility per legacy concern, each calling
    the matching `migrate*InValue` helper exported from
    [`@plone/plate/migrations`](./migrations/index.ts).
- **Static helpers (the API the server uses).** Exported from
  [`migrations/index.ts`](./migrations/index.ts). These are the pieces host apps
  should call. See the per-concern sections below.
- **Paste boundary (client).** The one thing the server cannot cover is a legacy
  Slate fragment pasted straight out of a legacy `volto-slate` editor
  (`application/x-slate-fragment`). That is handled by a single plugin,
  [`LegacyPastePlugin`](./components/editor/plugins/legacy-paste-plugin.ts),
  which overrides `insertFragment` and runs the static migrations once on the
  incoming fragment. It is wired into the **editor** kits only (`EditorKit`,
  `BlockEditorKit`) — the renderer never pastes. See
  [Paste boundary](#paste-boundary) below.

  > [!NOTE]
  > There are **no always-on `normalizeNode` / `normalizeInitialValue` plugins**
  > anymore. The old per-concern runtime plugins (`LegacyBoldPlugin`,
  > `LegacyItalicPlugin`, `LegacyStrikethroughPlugin`, `LegacyListPlugin`,
  > `LegacyLinkPlugin`) were removed from every kit — server-delivered content is
  > already normalized, so re-running migrations on every edit was redundant.
  > The plugin objects are still **exported** from their modules (not deleted),
  > in case a host such as `@kitconcept/volto-plate` needs to opt back into runtime
  > normalization, but nothing in this package registers them.

## Marks

- **Bold (`type: "strong"`)**
  - Static/server: `migrateLegacyBoldInValue`
  - Exported (unregistered) runtime plugin: `LegacyBoldPlugin` (wraps Plate normalize, sets `bold: true` on text descendants, unwraps `strong`)
  - Example:
    - Slate:
      ```json
      {
        "type": "strong",
        "children": [{ "text": "bold text" }]
      }
      ```
    - Plate:
      ```json
      { "text": "bold text", "bold": true }
      ```
- **Italic (`type: "em"`)**
  - Static/server: `migrateLegacyItalicInValue`
  - Exported (unregistered) runtime plugin: `LegacyItalicPlugin` (sets `italic: true`, unwraps `em`)
  - Example:
    - Slate:
      ```json
      {
        "type": "em",
        "children": [{ "text": "italic text" }]
      }
      ```
    - Plate:
      ```json
      { "text": "italic text", "italic": true }
      ```
- **Strikethrough (`type: "del"`)**
  - Static/server: `migrateLegacyStrikethroughInValue`
  - Exported (unregistered) runtime plugin: `LegacyStrikethroughPlugin` (sets `strikethrough: true`, unwraps `del`)
  - Example:
    - Slate:
      ```json
      {
        "type": "del",
        "children": [{ "text": "struck text" }]
      }
      ```
    - Plate:
      ```json
      { "text": "struck text", "strikethrough": true }
      ```

## Links

- Legacy shapes: `type: "link"` and/or `data.url` + optional `data.target`
- Static/server: `migrateLegacyLinksInValueStatic(value, linkType?)` defaults to `KEYS.link`.
- Exported (unregistered) runtime plugin: `LegacyLinkPlugin` normalizes to Plate link type (`KEYS.link`, usually `"a"`) and moves `data.url` → `url`, `data.target` → `target`.
  - Example:
    - Slate:
      ```json
      {
        "type": "link",
        "data": { "url": "https://example.com", "target": "_blank" },
        "children": [{ "text": "Example" }]
      }
      ```
    - Plate:
      ```json
      {
        "type": "a",
        "url": "https://example.com",
        "target": "_blank",
        "children": [{ "text": "Example" }]
      }
      ```

## Lists

- Legacy shapes: `type: "ul"` / `type: "ol"` with `li` children.
- Static/server: `migrateLegacyListsInValue`
- Exported (unregistered) runtime plugin: `LegacyListPlugin` flattens list wrappers into paragraphs with `listStyleType`, `indent: 1`, and `listStart` (for subsequent items).
  - Example (unordered):
    - Slate:
      ```json
      {
        "type": "ul",
        "children": [
          { "type": "li", "children": [{ "text": "first" }] },
          { "type": "li", "children": [{ "text": "second" }] }
        ]
      }
      ```
    - Plate:
      ```json
      [
        {
          "type": "p",
          "children": [{ "text": "first" }],
          "indent": 1,
          "listStyleType": "disc"
        },
        {
          "type": "p",
          "children": [{ "text": "second" }],
          "indent": 1,
          "listStyleType": "disc",
          "listStart": 2
        }
      ]
      ```
  - Example (ordered):
    - Slate:
      ```json
      {
        "type": "ol",
        "children": [
          { "type": "li", "children": [{ "text": "first" }] },
          { "type": "li", "children": [{ "text": "second" }] }
        ]
      }
      ```
    - Plate:
      ```json
      [
        {
          "type": "p",
          "children": [{ "text": "first" }],
          "indent": 1,
          "listStyleType": "decimal",
          "listRestartPolite": 1
        },
        {
          "type": "p",
          "children": [{ "text": "second" }],
          "indent": 1,
          "listStyleType": "decimal",
          "listStart": 2
        }
      ]
      ```

## Block width

- Legacy shapes: older block-width metadata on Plone blocks.
- Static/server: `migrateLegacyBlockWidthsInValue` (in [migrations/block-width.ts](./migrations/block-width.ts))
- There is **no** legacy-migration runtime plugin for this. `BlockWidthPlugin`'s
  runtime `normalizeInitialValue` only injects block-width *defaults* and
  transforms render props — it does not run the legacy migration. That migration
  is server-only.

## Paste boundary

The editor's only client-side normalization is at paste. When a fragment is
copied out of a legacy `volto-slate` editor, the clipboard carries the raw
legacy nodes under `application/x-slate-fragment`; Slate inserts them verbatim
via `insertFragment`. `LegacyPastePlugin`
([components/editor/plugins/legacy-paste-plugin.ts](./components/editor/plugins/legacy-paste-plugin.ts))
overrides `insertFragment` and runs the migrations once on the incoming
fragment, via `normalizeLegacyFragment(editor, fragment)`:

- Order mirrors `normalizeLegacyValue`: bold → italic → strikethrough → links →
  lists. The link step is editor-aware (`migrateLegacyLinksInValue`), so it
  resolves the configured link type.
- It is idempotent, so it is a no-op on native Plate fragments — including the
  common case of pasting external HTML, which Plate deserializes into clean
  Plate nodes before `insertFragment` is reached.
- It does **not** run the block-width migration (paste never carries Plone block
  metadata).

It is registered in the editor kits only — `EditorKit`
([components/editor/editor-kit.tsx](./components/editor/editor-kit.tsx)) and
`BlockEditorKit`
([components/editor/block-editor-kit.tsx](./components/editor/block-editor-kit.tsx)).
Renderer kits do not include it because the renderer never pastes.

## One-shot normalizer (server/manual scripts)

`normalizeLegacyValue(value, linkType?)` runs the bold, italic, strikethrough,
link, and list static migrations in place. Use it in a one-off migration script
or wherever a single call is more convenient than the per-concern helpers.

> [!NOTE]
> `normalizeLegacyValue` does **not** include the block-width migration — call
> `migrateLegacyBlockWidthsInValue` separately when you need it. Aurora's server
> pipeline runs each migration as an individual `somersaultMigration` utility
> rather than through `normalizeLegacyValue`.

## Types to aid manual scripts

Exported from the corresponding plugin modules:

- `LegacyBoldNode`
- `LegacyItalicNode`
- `LegacyLinkElement` / `LegacyLinkData`
- `LegacyStrikethroughNode`

(`LegacyListElement` is an internal type in `legacy-list-plugin.ts` and is not
exported.)

## Tests

- `components/editor/plugins/legacy-migrations.test.ts` — static migration
  helpers, expected shapes, and idempotency.
- `components/editor/plugins/legacy-paste-plugin.test.ts` — `normalizeLegacyFragment`
  and the `insertFragment` boundary override.
- `../cmsui/acceptance/tests/legacy-paste.test.ts` — end-to-end: pasting a legacy
  `volto-slate` fragment into the editor and asserting it renders as Plate shapes.
