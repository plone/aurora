import {
  ElementApi,
  PathApi,
  type Path,
  type SlateEditor,
  type TElement,
} from 'platejs';

import { getBlockContainer } from '../containers';
import { TITLE_BLOCK_TYPE } from '../title';
import { createGrid, isGridColumnElement, isGridElement } from './transforms';
import { GRID_COLUMN_KEY, GRID_KEY } from './types';

/*
 * Editing operations on grids, for the editor's menus and keyboard.
 */

/**
 * Inserts a grid with 2 equal, empty columns after the block that holds the
 * selection, and puts the caret in its first column.
 */
export const insertGrid = (editor: SlateEditor) => {
  const block = editor.api.block({ highest: true });
  const at = block ? PathApi.next(block[1]) : [editor.children.length];
  editor.tf.insertNodes(createGrid(), { at });
  editor.tf.select(editor.api.start([...at, 0, 0]));
  editor.tf.focus();
  return at;
};

/**
 * Wraps the selected top-level blocks into the first column of a grid with 2
 * columns. The page title is never wrapped, and nothing happens inside a
 * container or a grid.
 */
export const turnIntoGrid = (editor: SlateEditor): boolean => {
  if (!editor.selection) return false;
  if (getBlockContainer(editor, editor.selection)) return false;
  if (editor.api.above({ match: { type: GRID_KEY } })) return false;

  const entries = editor.api
    .blocks<TElement>({ mode: 'highest' })
    .filter(([node]) => node.type !== TITLE_BLOCK_TYPE);
  if (entries.length === 0) return false;

  const at = entries[0][1];
  const blocks = entries.map(([node]) => node);
  editor.tf.withoutNormalizing(() => {
    for (const [, path] of [...entries].reverse()) {
      editor.tf.removeNodes({ at: path });
    }
    editor.tf.insertNodes(createGrid({ blocks }), { at });
  });
  editor.tf.select(editor.api.start([...at, 0, 0]));
  return true;
};

/** The column that holds a location, by default the selection. */
export const getColumnEntry = (
  editor: SlateEditor,
  at = editor.selection,
): [TElement, Path] | undefined => {
  if (!at) return undefined;
  return editor.api.above<TElement>({ at, match: { type: GRID_COLUMN_KEY } });
};

/** The grid that holds a location, by default the selection. */
export const getGridEntry = (
  editor: SlateEditor,
  at = editor.selection,
): [TElement, Path] | undefined => {
  if (!at) return undefined;
  return editor.api.above<TElement>({ at, match: { type: GRID_KEY } });
};

/**
 * The path of a node of a grid, looked up in the editor's value. Slate's
 * `findPath` reads maps that React updates when it renders, so right after
 * nodes move it can still return their old position.
 */
export const findGridNodePath = (
  editor: SlateEditor,
  element: unknown,
): Path | undefined => {
  for (const [, path] of editor.api.nodes({
    at: [],
    match: (node) =>
      node === element && (isGridElement(node) || isGridColumnElement(node)),
  })) {
    return path;
  }
  return undefined;
};

/** Whether a node is a grid column. */
export const isColumn = (node: unknown): node is TElement =>
  ElementApi.isElement(node) && node.type === GRID_COLUMN_KEY;
