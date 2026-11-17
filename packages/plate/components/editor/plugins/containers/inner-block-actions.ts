import config from '@plone/registry';
import {
  ElementApi,
  KEYS,
  nanoid,
  PathApi,
  type Location,
  type Path,
  type SlateEditor,
  type TElement,
} from 'platejs';

import { announce } from '../../../../lib/announce';
import { showUndoToast } from '../../../../lib/undo-toast';
import { getTranslation, type TranslateFunction } from '../i18n';
import { createEmptyParagraph, getInnerBlockId } from './inner-blocks';
import { getContainerSpecBySlot, getContainerSpecs } from './registry';

/*
 * Actions on the blocks inside a container's slot, such as an accordion
 * panel's content: move, duplicate and delete.
 */

const STATIC_LABELS: Record<string, [key: string, defaultValue: string]> = {
  [KEYS.p]: ['plate.slashMenu.items.text', 'Text'],
  [KEYS.table]: ['plate.slashMenu.items.table', 'Table'],
  [KEYS.hr]: ['plate.blockSettings.blockTypes.separator', 'Separator'],
};

/** The name of a block type, such as "Text" or "Image". */
export const getInnerBlockLabel = (id: string, t: TranslateFunction) => {
  const known = STATIC_LABELS[id];
  if (known) return t(known[0], { defaultValue: known[1] });
  const blocksConfig = (
    config as unknown as {
      blocks?: { blocksConfig?: Record<string, { title?: unknown }> };
    }
  )?.blocks?.blocksConfig;
  const title = blocksConfig?.[id]?.title;
  return typeof title === 'string' ? title : id;
};

/** The name of a block, such as "Text" or "Image". */
export const getBlockLabel = (editor: SlateEditor, node: unknown) =>
  getInnerBlockLabel(
    getInnerBlockId(node as TElement) ?? KEYS.p,
    getTranslation(editor).t,
  );

/** The slot that holds the block at a path, if it's in a container. */
export const getSlotOfBlock = (
  editor: SlateEditor,
  blockPath: Path,
): [TElement, Path] | undefined => {
  if (blockPath.length === 0) return undefined;
  const parent = editor.api.parent(blockPath);
  return parent &&
    ElementApi.isElement(parent[0]) &&
    getContainerSpecBySlot(editor, parent[0].type)
    ? (parent as [TElement, Path])
    : undefined;
};

/** Whether the block at a path is a block of a container's slot. */
export const isInnerBlockPath = (editor: SlateEditor, path: Path) =>
  !!getSlotOfBlock(editor, path);

/**
 * The block of a container's slot that holds a location, by default the
 * selection, if any.
 */
export const getInnerBlockEntry = (
  editor: SlateEditor,
  at: Location | null = editor.selection,
): [TElement, Path] | undefined => {
  if (!at) return undefined;
  const slotTypes = new Set(getContainerSpecs(editor).map((spec) => spec.slot));
  if (slotTypes.size === 0) return undefined;
  const slot = editor.api.above<TElement>({
    at,
    match: (node) =>
      ElementApi.isElement(node) && slotTypes.has(node.type as string),
  });
  if (!slot) return undefined;
  const path = editor.api.start(at)!.path.slice(0, slot[1].length + 1);
  return editor.api.node<TElement>(path);
};

const announceBlock = (
  editor: SlateEditor,
  key: string,
  defaultValue: string,
  values: Record<string, unknown>,
) => {
  const { t } = getTranslation(editor);
  announce(
    t(`plate.blockSettings.announce.${key}`, { defaultValue, ...values }),
  );
};

/** Moves a block of a slot up (`-1`) or down (`1`) within the slot. */
export const moveInnerBlock = (
  editor: SlateEditor,
  blockPath: Path,
  delta: -1 | 1,
): boolean => {
  const slot = getSlotOfBlock(editor, blockPath);
  if (!slot) return false;
  const index = blockPath.at(-1)!;
  const target = index + delta;
  const total = slot[0].children.length;
  if (target < 0 || target >= total) return false;

  editor.tf.moveNodes({ at: blockPath, to: [...slot[1], target] });
  announceBlock(
    editor,
    'blockMoved',
    'Block moved to position {{position}} of {{total}}',
    { position: target + 1, total },
  );
  return true;
};

/** A copy of a node with new IDs for it and its descendants. */
export const withNewIds = <T>(node: T): T => {
  if (!node || typeof node !== 'object') return node;
  const copy: Record<string, unknown> = { ...(node as object) };
  if (typeof copy.id === 'string') copy.id = nanoid();
  if (Array.isArray(copy.children)) {
    copy.children = copy.children.map((child) => withNewIds(child));
  }
  return copy as T;
};

/** Inserts a copy of a block of a slot after it. */
export const duplicateInnerBlock = (editor: SlateEditor, blockPath: Path) => {
  if (!getSlotOfBlock(editor, blockPath)) return;
  const node = editor.api.node(blockPath)?.[0];
  if (!node) return;

  const at = PathApi.next(blockPath);
  editor.tf.insertNodes(withNewIds(node) as TElement, { at });
  editor.tf.select(editor.api.start(at));
  announceBlock(editor, 'blockDuplicated', 'Block duplicated', {});
};

/**
 * Removes a block of a slot and offers to undo it. The selection goes to the
 * block before it; a slot left without blocks gets an empty paragraph.
 */
export const removeInnerBlock = (editor: SlateEditor, blockPath: Path) => {
  const slot = getSlotOfBlock(editor, blockPath);
  if (!slot) return;
  const node = editor.api.node(blockPath)?.[0];
  const label = getBlockLabel(editor, node);
  const { t } = getTranslation(editor);
  const index = blockPath.at(-1)!;

  editor.tf.removeNodes({ at: blockPath });
  const slotNode = editor.api.node(slot[1])?.[0] as TElement | undefined;
  if (!slotNode?.children.some((child) => ElementApi.isElement(child))) {
    editor.tf.insertNodes(createEmptyParagraph(), { at: [...slot[1], 0] });
  }
  const previous = [...slot[1], Math.max(0, index - 1)];
  if (editor.api.node(previous)) {
    editor.tf.select(
      index > 0 ? editor.api.end(previous) : editor.api.start(previous),
    );
  }

  showUndoToast(
    editor,
    t('plate.blockSettings.blockDeleted', {
      defaultValue: '{{type}} block deleted',
      type: label,
    }),
  );
  announceBlock(editor, 'blockDeleted', '{{type}} block deleted', {
    type: label,
  });
};
