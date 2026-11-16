import type { SlateEditor, TElement } from 'platejs';

import type { NodeSettingsDeclaration } from '../block-settings/types';

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
};
