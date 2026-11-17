import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import type { SlateEditor, TElement } from 'platejs';

import type { NodeSettingsDeclaration } from '../block-settings/types';
import { GRID_COLUMN_KEY } from './types';

/*
 * The grid and its columns as selection levels. The editor kit adds their
 * settings forms.
 */

/** The position of a column in its grid, from 1. */
export const getColumnNumber = (editor: SlateEditor, node: TElement) => {
  try {
    const path = editor.api.findPath(node);
    return path ? (path.at(-1) ?? 0) + 1 : 1;
  } catch {
    return 1;
  }
};

export const gridSettingsLevel: NodeSettingsDeclaration = {
  label: (t) => t('plate.grid.label', { defaultValue: 'Grid' }),
};

export const gridColumnSettingsLevel: NodeSettingsDeclaration = {
  label: (t, node, editor) =>
    t('plate.grid.columnLabel', {
      defaultValue: 'Column {{position}}',
      position: getColumnNumber(editor, node),
    }),
  placeLabel: (t, node, editor) =>
    t('plate.grid.columnPlace', {
      defaultValue: 'column {{position}}',
      position: getColumnNumber(editor, node),
    }),
  // The caret in a block without settings of its own, such as text, shows
  // its column. A Plone block shows its own settings instead.
  fromSelection: (editor) => {
    if (!editor.selection) return undefined;
    if (editor.api.above({ match: { type: PLONE_BLOCK_TYPE } })) {
      return undefined;
    }
    return editor.api.above<TElement>({ match: { type: GRID_COLUMN_KEY } });
  },
};
