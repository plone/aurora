import type { StyleDefinition } from '@plone/types';
import type { TElement } from 'platejs';

import type { NodeSettingsDeclaration } from '../block-settings/types';
import type {
  BlockContainerOption,
  InnerBlockConfig,
} from '../containers/types';

export const GRID_KEY = 'grid';
export const GRID_COLUMN_KEY = 'grid_column';

export type GridGap = 's' | 'm' | 'l';

export type TGridColumnElement = TElement & {
  type: typeof GRID_COLUMN_KEY;
  id: string;
  /** The column's width weight: a positive integer. */
  size: number;
  children: TElement[];
};

export type TGridElement = TElement & {
  type: typeof GRID_KEY;
  id: string;
  /** An optional heading above the columns. */
  headline?: string;
  /** The name of one of the `themes` of the plugin options. */
  theme?: string;
  /** The space between columns. */
  gap: GridGap;
  /** Whether the columns stack when the grid is narrow. */
  stack: boolean;
  children: TGridColumnElement[];
};

/** The layouts offered for each column count, as lists of column weights. */
export type GridLayouts = Record<number, number[][]>;

export type GridPluginOptions = {
  /** The most columns a grid can have. */
  maxColumns: number;
  /** The layouts offered for each column count. */
  layouts: GridLayouts;
  /**
   * The blocks a column can hold: Plate.js element types, such as `p`, or
   * the `@type` of Plone blocks, such as `image`. Plone blocks are only
   * available when the editor has the Plone block adapter and the block is
   * registered.
   */
  allowedBlocks: string[];
  /**
   * The backgrounds editors can choose from, in the shape of
   * `config.blocks.themes`. The first one is the default.
   */
  themes: StyleDefinition[];
  /** Overrides of the blocks inside a grid, by block type (see containers). */
  blocksConfig?: Record<string, InnerBlockConfig>;
  container?: BlockContainerOption;
  settings?: NodeSettingsDeclaration;
  /** The settings schema; its `theme` field is a style field. */
  schema?: unknown;
  /** The definitions of the style fields, from `themes`. */
  styleDefinitions?: unknown;
};
