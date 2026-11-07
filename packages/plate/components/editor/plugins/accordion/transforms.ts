import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import config from '@plone/registry';
import {
  ElementApi,
  KEYS,
  nanoid,
  type Descendant,
  type SlateEditor,
  type TElement,
} from 'platejs';

import { getAccordionOptions } from './options';
import {
  ACCORDION_KEY,
  ACCORDION_PANEL_CONTENT_KEY,
  ACCORDION_PANEL_KEY,
  ACCORDION_PANEL_TITLE_KEY,
  type TAccordionElement,
  type TAccordionPanelContentElement,
  type TAccordionPanelElement,
  type TAccordionPanelTitleElement,
} from './types';

export const createEmptyParagraph = (): TElement => ({
  type: KEYS.p,
  children: [{ text: '' }],
});

export const createAccordionPanelTitle = (
  text = '',
): TAccordionPanelTitleElement => ({
  type: ACCORDION_PANEL_TITLE_KEY,
  children: [{ text }],
});

export const createAccordionPanelContent = (
  blocks: TElement[] = [],
): TAccordionPanelContentElement => ({
  type: ACCORDION_PANEL_CONTENT_KEY,
  children: blocks.length > 0 ? blocks : [createEmptyParagraph()],
});

export type CreateAccordionPanelOptions = {
  title?: string;
  blocks?: TElement[];
  startOpen?: boolean;
  anchor?: string;
};

/** A new panel: an empty title and, unless given, one empty paragraph. */
export const createAccordionPanel = ({
  title = '',
  blocks = [],
  startOpen = false,
  anchor = '',
}: CreateAccordionPanelOptions = {}): TAccordionPanelElement => ({
  type: ACCORDION_PANEL_KEY,
  id: nanoid(),
  startOpen,
  anchor,
  children: [
    createAccordionPanelTitle(title),
    createAccordionPanelContent(blocks),
  ],
});

export type CreateAccordionOptions = {
  panels?: TAccordionPanelElement[];
  exclusive?: boolean;
  theme?: string;
};

/** A new accordion with, unless given, one empty panel. */
export const createAccordion = ({
  panels = [],
  exclusive = true,
  theme = 'white',
}: CreateAccordionOptions = {}): TAccordionElement => ({
  type: ACCORDION_KEY,
  id: nanoid(),
  exclusive,
  theme,
  children: panels.length > 0 ? panels : [createAccordionPanel()],
});

/**
 * The ID a block has in the `allowedBlocks` option: the `@type` of a Plone
 * block, or the type of a Plate.js element.
 */
export const getInnerBlockId = (node: Descendant): string | undefined => {
  if (!ElementApi.isElement(node)) return undefined;
  if (node.type === PLONE_BLOCK_TYPE) {
    const blockType = (node as TElement & { '@type'?: unknown })['@type'];
    return typeof blockType === 'string' ? blockType : undefined;
  }
  return node.type;
};

const isRegisteredPloneBlock = (blockType: string) => {
  const blocksConfig = (
    config as unknown as {
      blocks?: { blocksConfig?: Record<string, unknown> };
    }
  )?.blocks?.blocksConfig;
  return Boolean(blocksConfig?.[blockType]);
};

/**
 * The blocks a panel can hold in this editor: the allowed blocks that the
 * editor has. A Plone block is available when the editor has the Plone block
 * adapter and the block is registered.
 */
export const getAvailableInnerBlocks = (
  editor: Pick<SlateEditor, 'getOptions' | 'plugins'>,
): string[] => {
  const { allowedBlocks } = getAccordionOptions(editor);
  const hasPloneBlocks = Boolean(editor.plugins[PLONE_BLOCK_TYPE]);

  return allowedBlocks.filter((id) => {
    if (id === ACCORDION_KEY) return false;
    if (editor.plugins[id]) return true;
    return hasPloneBlocks && isRegisteredPloneBlock(id);
  });
};

export const isAccordionPanel = (
  node: unknown,
): node is TAccordionPanelElement =>
  ElementApi.isElement(node) && node.type === ACCORDION_PANEL_KEY;
