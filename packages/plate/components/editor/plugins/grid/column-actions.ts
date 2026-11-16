import { PathApi, type Path, type SlateEditor, type TElement } from 'platejs';

import { announce } from '../../../../lib/announce';
import { showUndoToast } from '../../../../lib/undo-toast';
import { getTranslation } from '../i18n';
import {
  duplicateGridColumn,
  insertGridColumn,
  moveGridColumn,
  removeGridColumn,
} from './transforms';

/*
 * The column actions of the editor's controls and keyboard: each one is a
 * grid transform, announced to screen readers.
 */

const columnCount = (editor: SlateEditor, gridPath: Path) =>
  (editor.api.node<TElement>(gridPath)?.[0]?.children.length as number) ?? 0;

const say = (
  editor: SlateEditor,
  key: string,
  defaultValue: string,
  values: Record<string, unknown> = {},
) => {
  const { t } = getTranslation(editor);
  announce(t(`plate.grid.announce.${key}`, { defaultValue, ...values }));
};

/** Inserts an empty column at an index and puts the caret in it. */
export const addColumnAt = (
  editor: SlateEditor,
  gridPath: Path,
  index: number,
) => {
  const at = insertGridColumn(editor, gridPath, index, { select: true });
  if (!at) return undefined;
  editor.tf.focus();
  say(
    editor,
    'columnAdded',
    'Column added at position {{position}} of {{total}}',
    {
      position: (at.at(-1) ?? 0) + 1,
      total: columnCount(editor, gridPath),
    },
  );
  return at;
};

/** Moves a column one position left (`-1`) or right (`1`). */
export const moveColumnBy = (
  editor: SlateEditor,
  columnPath: Path,
  delta: -1 | 1,
): boolean => {
  const gridPath = PathApi.parent(columnPath);
  const from = columnPath.at(-1)!;
  const to = from + delta;
  if (!moveGridColumn(editor, gridPath, from, to)) return false;
  say(
    editor,
    'columnMoved',
    'Column moved to position {{position}} of {{total}}',
    {
      position: to + 1,
      total: columnCount(editor, gridPath),
    },
  );
  return true;
};

/** Inserts a copy of a column after it and puts the caret in the copy. */
export const duplicateColumn = (editor: SlateEditor, columnPath: Path) => {
  const at = duplicateGridColumn(
    editor,
    PathApi.parent(columnPath),
    columnPath.at(-1)!,
  );
  if (!at) return undefined;
  editor.tf.focus();
  say(editor, 'columnDuplicated', 'Column duplicated');
  return at;
};

/**
 * Deletes a column and offers to undo it. The only column of a grid is
 * never deleted.
 */
export const deleteColumn = (editor: SlateEditor, columnPath: Path) => {
  if (
    !removeGridColumn(editor, PathApi.parent(columnPath), columnPath.at(-1)!)
  ) {
    return false;
  }
  editor.tf.focus();
  const { t } = getTranslation(editor);
  showUndoToast(
    editor,
    t('plate.grid.columnDeleted', { defaultValue: 'Column deleted' }),
  );
  say(editor, 'columnDeleted', 'Column deleted');
  return true;
};
