import type { SlateEditor } from 'platejs';

import type { BlockContainerSpec } from '../containers/types';
import { getGridOptions } from './options';
import { GRID_COLUMN_KEY, GRID_KEY } from './types';

/**
 * The grid as a container: its columns hold the `allowedBlocks`, a grid
 * can't be placed inside another one, and a grid that ends up in a column,
 * such as after a paste, is unwrapped into its blocks.
 */
export const getGridContainerSpec = (
  editor: SlateEditor,
): BlockContainerSpec => {
  const options = getGridOptions(editor);
  return {
    type: GRID_KEY,
    slot: GRID_COLUMN_KEY,
    allowedBlocks: options.allowedBlocks,
    nestable: false,
    whenDisallowed: 'unwrap',
    blocksConfig: options.blocksConfig,
    label: (t) => t('plate.grid.label', { defaultValue: 'Grid' }),
    nestingNote: (t) =>
      t('plate.grid.noNesting', {
        defaultValue: "Grids can't be placed inside a grid.",
      }),
  };
};
