import type { SlateEditor } from 'platejs';

import type {
  BlockContainerSpec,
  InnerBlockSchemaEnhancer,
} from '../containers/types';
import { defaultInnerBlockSchemaEnhancer } from './inner-block-schema';
import { getAccordionOptions } from './options';
import { ACCORDION_KEY, ACCORDION_PANEL_CONTENT_KEY } from './types';

const getInnerBlockSchemaEnhancer = (
  editor: Pick<SlateEditor, 'getOptions'>,
): InnerBlockSchemaEnhancer => {
  try {
    const enhancer = editor.getOptions({
      key: ACCORDION_KEY,
    })?.innerBlockSchemaEnhancer;
    if (typeof enhancer === 'function') return enhancer;
  } catch {
    // The editor has no accordion plugin.
  }
  return defaultInnerBlockSchemaEnhancer;
};

/**
 * The accordion as a container: its panels hold the `allowedBlocks`, an
 * accordion can't be placed inside another one, and the blocks inside follow
 * `innerBlockSchemaEnhancer`.
 */
export const getAccordionContainerSpec = (
  editor: SlateEditor,
): BlockContainerSpec => ({
  type: ACCORDION_KEY,
  slot: ACCORDION_PANEL_CONTENT_KEY,
  allowedBlocks: getAccordionOptions(editor).allowedBlocks,
  nestable: false,
  whenDisallowed: 'move-after',
  blocksConfig: {
    '*': { schemaEnhancer: getInnerBlockSchemaEnhancer(editor) },
  },
  label: (t) => t('plate.accordion.label', { defaultValue: 'Accordion' }),
  nestingNote: (t) =>
    t('plate.accordion.noNesting', {
      defaultValue: "Accordions can't be placed inside an accordion.",
    }),
});
