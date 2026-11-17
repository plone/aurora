import { withoutFields } from '../containers/inner-block-schema';
import type { InnerBlockConfig } from '../containers/types';

/*
 * The grid's default rules for the blocks inside its columns. The grid's
 * `blocksConfig` option replaces them, one block type at a time.
 */

export const DEFAULT_GRID_BLOCKS_CONFIG: Record<string, InnerBlockConfig> = {
  // An image uses its column's width.
  image: {
    schemaEnhancer: (schema, { t }) =>
      withoutFields(
        schema,
        ['blockWidth', 'align', 'size'],
        t('plate.grid.innerImageNote', {
          defaultValue:
            "Inside a grid, an image uses its column's width, so size and alignment aren't offered.",
        }),
      ),
  },
  // A teaser takes the grid's background.
  teaser: {
    schemaEnhancer: (schema, { t }) =>
      withoutFields(
        schema,
        ['theme'],
        t('plate.grid.innerTeaserNote', {
          defaultValue:
            "Inside a grid, a teaser takes the grid's background, so its own background isn't offered.",
        }),
      ),
  },
};
