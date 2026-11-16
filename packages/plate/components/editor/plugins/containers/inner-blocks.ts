import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import config from '@plone/registry';
import {
  ElementApi,
  KEYS,
  type Descendant,
  type SlateEditor,
  type TElement,
} from 'platejs';

import { getContainerSpecs } from './registry';
import type { BlockContainerEntry, BlockContainerSpec } from './types';

export const createEmptyParagraph = (): TElement => ({
  type: KEYS.p,
  children: [{ text: '' }],
});

/**
 * The ID a block has in a container's `allowedBlocks`: the `@type` of a Plone
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
 * The blocks a container can hold in this editor: its allowed blocks that
 * the editor has, without containers that can't be nested in it. A Plone
 * block is available when the editor has the Plone block adapter and the
 * block is registered.
 *
 * Pass the containers around the slot, from the closest one out, so a
 * container that can't be nested isn't offered anywhere inside itself.
 */
export const getAvailableInnerBlocks = (
  editor: Pick<SlateEditor, 'plugins'>,
  spec: BlockContainerSpec,
  ancestors: Pick<BlockContainerEntry, 'spec'>[] = [],
): string[] => {
  const hasPloneBlocks = Boolean(editor.plugins[PLONE_BLOCK_TYPE]);
  const excluded = new Set(
    [{ spec }, ...ancestors]
      .filter(({ spec: item }) => !item.nestable)
      .map(({ spec: item }) => item.type),
  );

  return spec.allowedBlocks.filter((id) => {
    if (excluded.has(id)) return false;
    if (editor.plugins[id]) return true;
    return hasPloneBlocks && isRegisteredPloneBlock(id);
  });
};

/** Whether an element type is a container that some plugin declares. */
export const isContainerType = (
  editor: Pick<SlateEditor, 'plugins'>,
  type: string,
) => getContainerSpecs(editor).some((spec) => spec.type === type);
