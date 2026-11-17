import { PathApi, type SlateEditor, type TElement } from 'platejs';
import { createPlatePlugin } from 'platejs/react';

import { getColumnEntry, getGridEntry } from './editor-transforms';

export const GRID_EDITOR_KEY = 'gridEditor';

type KeyEvent = Pick<
  KeyboardEvent,
  'key' | 'shiftKey' | 'altKey' | 'metaKey' | 'ctrlKey' | 'preventDefault'
> & { defaultPrevented?: boolean };

const rangeOf = (editor: SlateEditor, path: number[]) => ({
  anchor: editor.api.start(path)!,
  focus: editor.api.end(path)!,
});

const isWhole = (editor: SlateEditor, path: number[]) => {
  const selection = editor.selection;
  if (!selection) return false;
  const range = rangeOf(editor, path);
  const edges = editor.api.edges(selection);
  if (!edges) return false;
  const [start, end] = edges;
  return (
    PathApi.equals(start.path, range.anchor.path) &&
    start.offset === range.anchor.offset &&
    PathApi.equals(end.path, range.focus.path) &&
    end.offset === range.focus.offset
  );
};

/**
 * Handles a key press in a grid. Returns `true` when it handled it.
 *
 * - Columns never merge: Backspace at the start of a column's first block
 *   and Delete at the end of its last block do nothing.
 * - ArrowDown at the end of a column goes to the start of the next column,
 *   and ArrowUp at the start of a column to the end of the one before.
 * - Mod+A selects the column, then the grid, then the document.
 */
export const handleGridKeyDown = (
  editor: SlateEditor,
  event: KeyEvent,
): boolean => {
  if (event.defaultPrevented) return false;
  const column = getColumnEntry(editor);
  if (!column) return false;
  const [columnNode, columnPath] = column;

  const isSelectAll =
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    event.key.toLowerCase() === 'a';
  if (isSelectAll) {
    if (!isWhole(editor, columnPath)) {
      event.preventDefault();
      editor.tf.select(rangeOf(editor, columnPath));
      return true;
    }
    const grid = getGridEntry(editor);
    if (grid && !isWhole(editor, grid[1])) {
      event.preventDefault();
      editor.tf.select(rangeOf(editor, grid[1]));
      return true;
    }
    return false;
  }

  if (event.altKey || event.metaKey || event.ctrlKey) return false;
  if (!editor.selection || !editor.api.isCollapsed()) return false;
  const anchor = editor.selection.anchor;
  const columnStart = editor.api.isStart(anchor, columnPath);
  const columnEnd = editor.api.isEnd(anchor, columnPath);

  if (event.key === 'Backspace' && columnStart) {
    // List items outdent first, as anywhere else.
    const first = columnNode.children[0] as TElement & { indent?: number };
    if (first?.indent) return false;
    event.preventDefault();
    return true;
  }
  if (event.key === 'Delete' && columnEnd) {
    event.preventDefault();
    return true;
  }

  const index = columnPath.at(-1)!;
  const gridPath = PathApi.parent(columnPath);
  const grid = editor.api.node<TElement>(gridPath)?.[0];
  if (event.key === 'ArrowDown' && columnEnd && !event.shiftKey) {
    if (!grid || index >= grid.children.length - 1) return false;
    event.preventDefault();
    editor.tf.select(editor.api.start([...gridPath, index + 1])!);
    return true;
  }
  if (event.key === 'ArrowUp' && columnStart && !event.shiftKey) {
    if (index === 0) return false;
    event.preventDefault();
    editor.tf.select(editor.api.end([...gridPath, index - 1])!);
    return true;
  }
  return false;
};

/** The grid's keyboard handling in the editor. */
export const GridEditorPlugin = createPlatePlugin({
  key: GRID_EDITOR_KEY,
  // Runs before the plugins that merge blocks on Backspace and Delete.
  priority: 200,
  handlers: {
    onKeyDown: ({ editor, event }) =>
      handleGridKeyDown(editor, event as unknown as KeyEvent),
  },
});
