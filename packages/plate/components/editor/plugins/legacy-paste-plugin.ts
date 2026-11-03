import { createSlatePlugin } from 'platejs';
import type { SlateEditor, Value } from 'platejs';

import { migrateLegacyBoldInValue } from './legacy-bold-plugin';
import { migrateLegacyItalicInValue } from './legacy-italic-plugin';
import { migrateLegacyStrikethroughInValue } from './legacy-strikethrough-plugin';
import { migrateLegacyLinksInValue } from './legacy-link-plugin';
import { migrateLegacyListsInValue } from './legacy-list-plugin';
import { cloneValueToWritable } from './legacy-utils';

/**
 * Run the legacy Slate → Plate static migrations over a pasted fragment.
 *
 * This is the single client-side normalization boundary for content that did
 * not go through the server migration — e.g. a fragment copied out of a legacy
 * `volto-slate` editor and pasted in (`application/x-slate-fragment`). Content
 * loaded into the editor is already normalized by the server, so no always-on
 * `normalizeNode` hooks are needed for it.
 *
 * The order mirrors `normalizeLegacyValue`: marks first (so text nodes inside
 * list items get their marks), then links, then list flattening. Each helper is
 * idempotent, so running it on already-normalized (native Plate) fragments is a
 * no-op — which is what happens on the common HTML-paste path.
 */
export const normalizeLegacyFragment = (
  editor: SlateEditor,
  fragment: Value,
): Value => {
  if (!Array.isArray(fragment)) return fragment;

  let value = cloneValueToWritable(fragment);
  value = migrateLegacyBoldInValue(value);
  value = migrateLegacyItalicInValue(value);
  value = migrateLegacyStrikethroughInValue(value);
  value = migrateLegacyLinksInValue(editor, value);
  value = migrateLegacyListsInValue(value);

  return value;
};

/**
 * Normalizes pasted legacy Slate fragments at the `insertFragment` boundary.
 *
 * Replaces the per-mark/list/link runtime `normalizeNode` plugins: instead of
 * re-checking every node on every edit, it runs the migrations once, only on
 * the fragment being inserted. Add it to editor kits (not renderer kits — the
 * renderer never pastes).
 */
export const LegacyPastePlugin = createSlatePlugin({
  key: 'legacyPasteNormalizer',
}).overrideEditor(({ editor, tf: { insertFragment } }: any) => ({
  transforms: {
    insertFragment(fragment: any, options?: any) {
      insertFragment(normalizeLegacyFragment(editor, fragment) as any, options);
    },
  },
}));
