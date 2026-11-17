import { ElementApi, KEYS, TextApi } from 'platejs';
import type { Descendant, Value } from 'platejs';

import { applyNormalizedValue, cloneValueToWritable } from './legacy-utils';

type LegacyElement = {
  type?: string;
  children?: Descendant[];
  [key: string]: unknown;
};

// Inline element types that can appear directly inside a legacy flat
// blockquote. The migration runs without an editor, so inline-ness can't be
// resolved from the plugin list.
const INLINE_TYPES = new Set<string>([
  KEYS.link,
  'link',
  KEYS.mention,
  KEYS.inlineEquation,
  KEYS.date,
]);

const isInlineNode = (node: Descendant) =>
  TextApi.isText(node) ||
  (ElementApi.isElement(node) && INLINE_TYPES.has(node.type));

/**
 * Wraps the direct text/inline children of a blockquote in paragraphs,
 * keeping existing block children as they are. Mirrors the load-time
 * normalization of Plate's `BlockquotePlugin`.
 */
const wrapBlockquoteChildren = (children: Descendant[] = []): Descendant[] => {
  const blocks: Descendant[] = [];
  let inlineRun: Descendant[] = [];

  const flushInlineRun = () => {
    if (inlineRun.length === 0) return;
    blocks.push({ type: KEYS.p, children: inlineRun } as Descendant);
    inlineRun = [];
  };

  children.forEach((child) => {
    if (isInlineNode(child)) {
      inlineRun.push(child);
      return;
    }

    flushInlineRun();
    blocks.push(child);
  });

  flushInlineRun();

  return blocks.length > 0
    ? blocks
    : [{ type: KEYS.p, children: [{ text: '' }] } as Descendant];
};

/**
 * Converts legacy flat blockquotes (`{ type: 'blockquote', children: [{ text }] }`)
 * into the Plate v53+ container shape, where a blockquote holds block children:
 * `{ type: 'blockquote', children: [{ type: 'p', children: [{ text }] }] }`.
 */
export const migrateLegacyBlockquotesInValue = (nodes: Value): Value => {
  const mutable = cloneValueToWritable(nodes) as LegacyElement[];

  const visit = (node: LegacyElement) => {
    if (!Array.isArray(node?.children)) return;

    if (
      node.type === KEYS.blockquote &&
      node.children.some((child) => isInlineNode(child))
    ) {
      node.children = wrapBlockquoteChildren(node.children);
    }

    node.children.forEach((child) => visit(child as LegacyElement));
  };

  mutable.forEach(visit);
  applyNormalizedValue(nodes, mutable as Value);
  return mutable as Value;
};
