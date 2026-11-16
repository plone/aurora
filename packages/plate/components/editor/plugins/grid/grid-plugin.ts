import {
  createSlatePlugin,
  createTSlatePlugin,
  type PluginConfig,
} from 'platejs';

import { getGridContainerSpec } from './container';
import { normalizeGridNode } from './normalize';
import {
  DEFAULT_GRID_OPTIONS,
  gridSchema,
  gridStyleDefinitions,
} from './options';
import { gridColumnSettingsLevel, gridSettingsLevel } from './settings-levels';
import { GRID_COLUMN_KEY, GRID_KEY, type GridPluginOptions } from './types';

export type GridConfig = PluginConfig<typeof GRID_KEY, GridPluginOptions>;

/**
 * The grid: columns side by side, each with its own blocks and a width
 * weight.
 *
 * Configure it with `GridPlugin.configure({ options })`: the most columns a
 * grid can have (`maxColumns`), the layouts for each column count
 * (`layouts`), the blocks a column can hold (`allowedBlocks`), the
 * backgrounds (`themes`) and overrides for the blocks inside it
 * (`blocksConfig`).
 */
export const BaseGridPlugin = createTSlatePlugin<GridConfig>({
  key: GRID_KEY,
  node: { isContainer: true, isElement: true },
  options: {
    ...DEFAULT_GRID_OPTIONS,
    container: getGridContainerSpec,
    settings: gridSettingsLevel,
    schema: gridSchema,
    styleDefinitions: gridStyleDefinitions,
  },
}).overrideEditor(({ editor, tf: { normalizeNode } }) => ({
  transforms: {
    normalizeNode(entry, options) {
      const [node, path] = entry;
      if (normalizeGridNode(editor, node, path)) return;
      return normalizeNode(entry, options);
    },
  },
}));

export const BaseGridColumnPlugin = createSlatePlugin({
  key: GRID_COLUMN_KEY,
  node: { isContainer: true, isElement: true, isStrictSiblings: true },
  options: { settings: gridColumnSettingsLevel },
});
