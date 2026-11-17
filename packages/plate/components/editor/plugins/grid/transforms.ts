import {
  ElementApi,
  KEYS,
  nanoid,
  TextApi,
  type Path,
  type SlateEditor,
  type TElement,
} from 'platejs';

import { createEmptyParagraph, withNewIds } from '../containers';
import { equalLayout, getGridOptions, getGridLayouts } from './options';
import {
  GRID_COLUMN_KEY,
  GRID_KEY,
  type TGridColumnElement,
  type TGridElement,
} from './types';

/*
 * Transforms on grids and their columns. Each one is a single undo step and
 * leaves the grid valid. They take the grid's path, which callers look up
 * by node identity, since a stale path points at another node after moves.
 */

/** A new column with the given blocks, or an empty paragraph. */
export const createGridColumn = (
  blocks: TElement[] = [],
  size = 1,
): TGridColumnElement => ({
  type: GRID_COLUMN_KEY,
  id: nanoid(),
  size,
  children: blocks.length > 0 ? blocks : [createEmptyParagraph()],
});

export type CreateGridOptions = {
  /** The column weights; their count is the number of columns. */
  layout?: number[];
  /** Blocks for the first column. */
  blocks?: TElement[];
};

/** A new grid, by default with 2 equal, empty columns. */
export const createGrid = ({
  layout = [1, 1],
  blocks = [],
}: CreateGridOptions = {}): TGridElement => ({
  type: GRID_KEY,
  id: nanoid(),
  theme: 'default',
  gap: 'm',
  stack: true,
  children: layout.map((size, index) =>
    createGridColumn(index === 0 ? blocks : [], size),
  ),
});

export const isGridElement = (node: unknown): node is TGridElement =>
  ElementApi.isElement(node) && node.type === GRID_KEY;

export const isGridColumnElement = (
  node: unknown,
): node is TGridColumnElement =>
  ElementApi.isElement(node) && node.type === GRID_COLUMN_KEY;

const getGrid = (editor: SlateEditor, gridPath: Path) => {
  const node = editor.api.node(gridPath)?.[0];
  return isGridElement(node) ? node : undefined;
};

/** Runs a change as one undo step. */
const asOneStep = (editor: SlateEditor, change: () => void) => {
  const tf = editor.tf as { withNewBatch?: (fn: () => void) => void };
  const run = () => editor.tf.withoutNormalizing(change);
  if (tf.withNewBatch) tf.withNewBatch(run);
  else run();
};

const isEmptyParagraph = (node: unknown) =>
  ElementApi.isElement(node) &&
  node.type === KEYS.p &&
  !node.listStyleType &&
  node.children.every((child) => TextApi.isText(child) && !child.text);

/** The blocks of a column worth keeping when it's merged into another. */
const contentOf = (column: TElement) =>
  column.children.filter(
    (child) => ElementApi.isElement(child) && !isEmptyParagraph(child),
  ) as TElement[];

/** Whether another column fits in the grid. */
export const canAddGridColumn = (editor: SlateEditor, gridPath: Path) => {
  const grid = getGrid(editor, gridPath);
  return !!grid && grid.children.length < getGridOptions(editor).maxColumns;
};

/**
 * Inserts an empty column, with weight 1, at an index of a grid. Returns its
 * path, or `undefined` when the grid has its maximum number of columns.
 */
export const insertGridColumn = (
  editor: SlateEditor,
  gridPath: Path,
  index: number,
  { select = false }: { select?: boolean } = {},
): Path | undefined => {
  const grid = getGrid(editor, gridPath);
  if (!grid || !canAddGridColumn(editor, gridPath)) return undefined;
  const at = [...gridPath, Math.max(0, Math.min(index, grid.children.length))];
  asOneStep(editor, () => {
    editor.tf.insertNodes(createGridColumn(), { at });
  });
  if (select) editor.tf.select(editor.api.start(at));
  return at;
};

/**
 * Removes a column of a grid. A grid keeps at least one column. The caret
 * goes to the end of the column before it, or the start of the one after.
 */
export const removeGridColumn = (
  editor: SlateEditor,
  gridPath: Path,
  index: number,
): boolean => {
  const grid = getGrid(editor, gridPath);
  if (!grid || grid.children.length < 2 || !grid.children[index]) return false;
  asOneStep(editor, () => {
    editor.tf.removeNodes({ at: [...gridPath, index] });
  });
  const target = [...gridPath, Math.max(0, index - 1)];
  editor.tf.select(
    index > 0 ? editor.api.end(target) : editor.api.start(target),
  );
  return true;
};

/**
 * Inserts a copy of a column after it, with new IDs for the column and its
 * blocks, and the same weight. Returns the copy's path.
 */
export const duplicateGridColumn = (
  editor: SlateEditor,
  gridPath: Path,
  index: number,
): Path | undefined => {
  const grid = getGrid(editor, gridPath);
  const column = grid?.children[index];
  if (!column || !canAddGridColumn(editor, gridPath)) return undefined;
  const at = [...gridPath, index + 1];
  asOneStep(editor, () => {
    editor.tf.insertNodes(withNewIds(column), { at });
  });
  editor.tf.select(editor.api.start(at));
  return at;
};

/** Moves a column to another position of its grid. It keeps its weight. */
export const moveGridColumn = (
  editor: SlateEditor,
  gridPath: Path,
  from: number,
  to: number,
): boolean => {
  const grid = getGrid(editor, gridPath);
  const total = grid?.children.length ?? 0;
  if (!grid || from === to || from < 0 || to < 0) return false;
  if (from >= total || to >= total) return false;
  asOneStep(editor, () => {
    editor.tf.moveNodes({ at: [...gridPath, from], to: [...gridPath, to] });
  });
  return true;
};

/**
 * Sets the number of columns. New columns go at the end. Removed columns
 * move their blocks into the last remaining column, so nothing is lost.
 * The columns then get the equal layout.
 */
export const setGridColumnCount = (
  editor: SlateEditor,
  gridPath: Path,
  count: number,
): boolean => {
  const grid = getGrid(editor, gridPath);
  const max = getGridOptions(editor).maxColumns;
  const total = grid?.children.length ?? 0;
  if (!grid || count < 1 || count > max || count === total) return false;

  asOneStep(editor, () => {
    if (count > total) {
      for (let index = total; index < count; index += 1) {
        editor.tf.insertNodes(createGridColumn(), {
          at: [...gridPath, index],
        });
      }
    } else {
      const lastPath = [...gridPath, count - 1];
      for (let index = total - 1; index >= count; index -= 1) {
        const column = grid.children[index];
        const blocks = contentOf(column);
        const last = editor.api.node<TElement>(lastPath)![0];
        const lastBlocks = contentOf(last);
        // An empty last column takes the blocks in place of its paragraph.
        if (blocks.length > 0 && lastBlocks.length === 0) {
          editor.tf.removeNodes({ at: [...lastPath, 0] });
        }
        const offset = editor.api.node<TElement>(lastPath)![0].children.length;
        blocks.forEach((block, position) => {
          editor.tf.insertNodes(block, {
            at: [...lastPath, offset + position],
          });
        });
        editor.tf.removeNodes({ at: [...gridPath, index] });
      }
    }
    equalLayout(count).forEach((size, index) => {
      editor.tf.setNodes({ size }, { at: [...gridPath, index] });
    });
  });
  return true;
};

/** Sets the column weights from a layout with one weight per column. */
export const applyGridLayout = (
  editor: SlateEditor,
  gridPath: Path,
  layout: number[],
): boolean => {
  const grid = getGrid(editor, gridPath);
  if (!grid || layout.length !== grid.children.length) return false;
  asOneStep(editor, () => {
    layout.forEach((size, index) => {
      editor.tf.setNodes({ size }, { at: [...gridPath, index] });
    });
  });
  return true;
};

/** The column weights of a grid. */
export const getGridSizes = (grid: TGridElement): number[] =>
  grid.children.map((column) =>
    typeof column.size === 'number' ? column.size : 1,
  );

/** The layouts the grid offers for its current number of columns. */
export const getGridLayoutChoices = (editor: SlateEditor, grid: TGridElement) =>
  getGridLayouts(getGridOptions(editor), grid.children.length);
