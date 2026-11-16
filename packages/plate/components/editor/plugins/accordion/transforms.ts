import { ElementApi, nanoid, type SlateEditor, type TElement } from 'platejs';

import {
  createEmptyParagraph,
  getAvailableInnerBlocks as getContainerAvailableBlocks,
} from '../containers';
import { getAccordionContainerSpec } from './container';
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

export { createEmptyParagraph, getInnerBlockId } from '../containers';

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
 * The blocks a panel can hold in this editor: the allowed blocks that the
 * editor has. A Plone block is available when the editor has the Plone block
 * adapter and the block is registered.
 */
export const getAvailableInnerBlocks = (
  editor: Pick<SlateEditor, 'getOptions' | 'plugins'>,
): string[] =>
  getContainerAvailableBlocks(
    editor,
    getAccordionContainerSpec(editor as SlateEditor),
  );

export const isAccordionPanel = (
  node: unknown,
): node is TAccordionPanelElement =>
  ElementApi.isElement(node) && node.type === ACCORDION_PANEL_KEY;
