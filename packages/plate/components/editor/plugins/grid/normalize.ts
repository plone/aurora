import {
  ElementApi,
  nanoid,
  type Path,
  type SlateEditor,
  type TElement,
} from 'platejs';

import { createEmptyParagraph, normalizeSlotBlocks } from '../containers';
import { GRID_GAPS, getGridOptions } from './options';
import {
  createGridColumn,
  isGridColumnElement,
  isGridElement,
} from './transforms';
import { GRID_COLUMN_KEY, GRID_KEY } from './types';

const isEmptyColumn = (column: TElement) =>
  column.children.every(
    (child) =>
      !ElementApi.isElement(child) ||
      (child.type === 'p' &&
        child.children.every(
          (item) => 'text' in item && !(item as { text: string }).text,
        )),
  );

const normalizeGrid = (
  editor: SlateEditor,
  node: TElement,
  path: Path,
): boolean => {
  const { maxColumns, themes } = getGridOptions(editor);

  const defaults: Record<string, unknown> = {};
  if (typeof node.id !== 'string' || !node.id) defaults.id = nanoid();
  if (!GRID_GAPS.includes(node.gap as never)) defaults.gap = 'm';
  if (typeof node.stack !== 'boolean') defaults.stack = true;
  if (!themes.some((theme) => theme.name === node.theme)) {
    defaults.theme = themes[0]?.name ?? 'default';
  }
  if (Object.keys(defaults).length > 0) {
    editor.tf.setNodes(defaults, { at: path });
    return true;
  }
  if (node.headline !== undefined && typeof node.headline !== 'string') {
    editor.tf.unsetNodes('headline', { at: path });
    return true;
  }

  const elements = node.children.filter((child) => ElementApi.isElement(child));
  if (elements.length === 0) {
    editor.tf.insertNodes(createGridColumn(), { at: [...path, 0] });
    return true;
  }

  // Content that isn't a column joins the column before it, or a new one.
  const index = node.children.findIndex(
    (child) => ElementApi.isElement(child) && child.type !== GRID_COLUMN_KEY,
  );
  if (index >= 0) {
    const at = [...path, index];
    const previous = index > 0 ? node.children[index - 1] : undefined;
    if (isGridColumnElement(previous)) {
      editor.tf.moveNodes({
        at,
        to: [...path, index - 1, previous.children.length],
      });
    } else {
      editor.tf.wrapNodes(
        { type: GRID_COLUMN_KEY, id: nanoid(), size: 1, children: [] },
        { at },
      );
    }
    return true;
  }

  // Columns beyond the maximum move their blocks into the last one allowed.
  if (node.children.length > maxColumns) {
    const extraPath = [...path, node.children.length - 1];
    const extra = node.children.at(-1) as TElement;
    const lastPath = [...path, maxColumns - 1];
    const last = node.children[maxColumns - 1] as TElement;
    editor.tf.withoutNormalizing(() => {
      if (!isEmptyColumn(extra)) {
        if (isEmptyColumn(last)) {
          editor.tf.removeNodes({ at: [...lastPath, 0] });
        }
        const offset = editor.api.node<TElement>(lastPath)![0].children.length;
        extra.children.forEach((block, position) => {
          editor.tf.insertNodes(block as TElement, {
            at: [...lastPath, offset + position],
          });
        });
      }
      editor.tf.removeNodes({ at: extraPath });
    });
    return true;
  }

  return false;
};

const normalizeColumn = (
  editor: SlateEditor,
  node: TElement,
  path: Path,
): boolean => {
  const parent = editor.api.parent(path);
  if (!parent || !isGridElement(parent[0])) {
    // A column outside a grid leaves its blocks in place.
    editor.tf.unwrapNodes({ at: path });
    return true;
  }

  const defaults: Record<string, unknown> = {};
  if (typeof node.id !== 'string' || !node.id) defaults.id = nanoid();
  const size = node.size;
  if (typeof size !== 'number' || !Number.isInteger(size) || size < 1) {
    defaults.size =
      typeof size === 'number' && Number.isFinite(size)
        ? Math.max(1, Math.round(size))
        : 1;
  }
  if (Object.keys(defaults).length > 0) {
    editor.tf.setNodes(defaults, { at: path });
    return true;
  }

  if (!node.children.some((child) => ElementApi.isElement(child))) {
    editor.tf.insertNodes(createEmptyParagraph(), { at: [...path, 0] });
    return true;
  }

  // The blocks of the column follow the grid's container rules.
  return normalizeSlotBlocks(editor, node, path);
};

/**
 * Keeps grids valid: 1 to `maxColumns` columns, each holding at least one
 * of the blocks a column can hold, with a positive integer `size`. Content
 * that isn't a column is wrapped in one, extra columns are merged into the
 * last one, and a grid inside a column is unwrapped into its blocks. Widths
 * are never rebalanced, and a grid is never unwrapped on its own.
 *
 * Returns `true` when it changed the editor, and the node is normalized again.
 */
export const normalizeGridNode = (
  editor: SlateEditor,
  node: unknown,
  path: Path,
): boolean => {
  if (!ElementApi.isElement(node)) return false;
  if (node.type === GRID_KEY) return normalizeGrid(editor, node, path);
  if (node.type === GRID_COLUMN_KEY) return normalizeColumn(editor, node, path);
  return false;
};
