import type { StyleDefinition } from '@plone/types';
import type { SlateEditor } from 'platejs';

import {
  GRID_KEY,
  type GridGap,
  type GridLayouts,
  type GridPluginOptions,
} from './types';

export const GRID_GAPS: GridGap[] = ['s', 'm', 'l'];
export const DEFAULT_GRID_GAP: GridGap = 'm';

export const DEFAULT_GRID_LAYOUTS: GridLayouts = {
  1: [[1]],
  2: [
    [1, 1],
    [2, 1],
    [1, 2],
  ],
  3: [
    [1, 1, 1],
    [2, 1, 1],
    [1, 2, 1],
    [1, 1, 2],
  ],
  4: [[1, 1, 1, 1]],
};

/**
 * The default backgrounds: none, and grey. They use the names and custom
 * properties of block themes, so a site theme system can replace them.
 */
export const DEFAULT_GRID_THEMES: StyleDefinition[] = [
  { name: 'default', label: 'Default', style: {} },
  {
    name: 'grey',
    label: 'Grey',
    style: {
      '--theme-color': '#ecebeb',
      '--theme-high-contrast-color': '#ffffff',
      '--theme-foreground-color': '#000000',
      '--theme-low-contrast-foreground-color': '#555555',
    },
  },
];

export const DEFAULT_GRID_OPTIONS: GridPluginOptions = {
  maxColumns: 4,
  layouts: DEFAULT_GRID_LAYOUTS,
  allowedBlocks: [
    'p',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'image',
    'teaser',
    'video',
    'listing',
  ],
  themes: DEFAULT_GRID_THEMES,
};

/** The grid plugin options, with the defaults for any missing one. */
export const getGridOptions = (
  editor: Pick<SlateEditor, 'getOptions'>,
): GridPluginOptions => {
  let options: Partial<GridPluginOptions> = {};
  try {
    options = editor.getOptions({ key: GRID_KEY }) ?? {};
  } catch {
    // The editor has no grid plugin.
  }

  const maxColumns = Math.max(
    1,
    Math.floor(options.maxColumns ?? DEFAULT_GRID_OPTIONS.maxColumns),
  );
  return {
    ...options,
    maxColumns,
    layouts: options.layouts ?? DEFAULT_GRID_OPTIONS.layouts,
    allowedBlocks: options.allowedBlocks ?? DEFAULT_GRID_OPTIONS.allowedBlocks,
    themes:
      options.themes && options.themes.length > 0
        ? options.themes
        : DEFAULT_GRID_OPTIONS.themes,
  };
};

/** The layouts offered for a column count. */
export const getGridLayouts = (
  options: Pick<GridPluginOptions, 'layouts'>,
  count: number,
): number[][] =>
  (options.layouts[count] ?? []).filter((layout) => layout.length === count);

/** The index of the layout that matches column sizes, or `-1`. */
export const findMatchingLayout = (
  sizes: number[],
  layouts: number[][],
): number =>
  layouts.findIndex(
    (layout) =>
      layout.length === sizes.length &&
      layout.every((size, index) => size === sizes[index]),
  );

/** The equal layout for a column count. */
export const equalLayout = (count: number) =>
  Array.from({ length: count }, () => 1);

/**
 * The grid's settings schema. The background is a style field, resolved
 * against the plugin's `themes`.
 */
export const getGridSchema = (
  themes: StyleDefinition[] = DEFAULT_GRID_THEMES,
) => ({
  title: 'Grid',
  fieldsets: [
    {
      id: 'default',
      title: 'Default',
      fields: ['headline', 'theme', 'gap', 'stack'],
    },
  ],
  properties: {
    headline: { title: 'Headline', type: 'string' },
    theme: {
      title: 'Background',
      type: 'string',
      styleField: true,
      default: themes[0]?.name ?? 'default',
      choices: themes.map((theme) => [theme.name, theme.label]),
    },
    gap: {
      title: 'Gap',
      type: 'string',
      default: DEFAULT_GRID_GAP,
      choices: GRID_GAPS.map((gap) => [gap, gap.toUpperCase()]),
    },
    stack: { title: 'Stack on narrow widths', type: 'boolean', default: true },
  },
  required: [],
});

/** The grid's `schema` option: it follows the plugin's `themes`. */
export const gridSchema = ({
  options,
}: { options?: Partial<GridPluginOptions> } = {}) =>
  getGridSchema(
    options?.themes && options.themes.length > 0
      ? options.themes
      : DEFAULT_GRID_THEMES,
  );

/** The grid's `styleDefinitions` option: the `theme` field's themes. */
export const gridStyleDefinitions = (options: Partial<GridPluginOptions>) => ({
  theme:
    options.themes && options.themes.length > 0
      ? options.themes
      : DEFAULT_GRID_THEMES,
});
