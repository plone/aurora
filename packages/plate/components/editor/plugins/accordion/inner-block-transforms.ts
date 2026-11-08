import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import config from '@plone/registry';
import { insertTable } from '@platejs/table';
import {
  ElementApi,
  KEYS,
  nanoid,
  PathApi,
  TextApi,
  type Location,
  type Path,
  type SlateEditor,
  type TElement,
} from 'platejs';

import { announce } from '../../../../lib/announce';
import { showUndoToast } from '../../../../lib/undo-toast';
import { getTranslation, type TranslateFunction } from '../i18n';
import { setPanelOpen } from './editor-transforms';
import {
  createEmptyParagraph,
  getAvailableInnerBlocks,
  getInnerBlockId,
} from './transforms';
import { ACCORDION_PANEL_CONTENT_KEY } from './types';

/*
 * Operations on the blocks of an accordion panel: the block toolbar, the
 * insert points and "Turn into".
 */

const STATIC_LABELS: Record<string, [key: string, defaultValue: string]> = {
  [KEYS.p]: ['plate.slashMenu.items.text', 'Text'],
  [KEYS.table]: ['plate.slashMenu.items.table', 'Table'],
  [KEYS.hr]: ['plate.accordion.blockTypes.separator', 'Separator'],
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

/** The name of a block of a panel, such as "Text" or "Image". */
export const getBlockLabel = (editor: SlateEditor, node: unknown) =>
  getInnerBlockLabel(
    getInnerBlockId(node as TElement) ?? KEYS.p,
    getTranslation(editor).t,
  );

const blockLabel = getBlockLabel;

const getContent = (editor: SlateEditor, blockPath: Path) => {
  const parent = editor.api.parent(blockPath);
  return parent &&
    ElementApi.isElement(parent[0]) &&
    parent[0].type === ACCORDION_PANEL_CONTENT_KEY
    ? (parent as [TElement, Path])
    : undefined;
};

/** Whether the block at a path is a block of an accordion panel. */
export const isInnerBlockPath = (editor: SlateEditor, path: Path) =>
  path.length > 0 && !!getContent(editor, path);

/**
 * The block of a panel that holds a location, by default the selection, if
 * any.
 */
export const getInnerBlockEntry = (
  editor: SlateEditor,
  at: Location | null = editor.selection,
): [TElement, Path] | undefined => {
  if (!at) return undefined;
  const content = editor.api.above<TElement>({
    at,
    match: { type: ACCORDION_PANEL_CONTENT_KEY },
  });
  if (!content) return undefined;
  const path = editor.api.start(at)!.path.slice(0, content[1].length + 1);
  return editor.api.node<TElement>(path);
};

const announceBlock = (
  editor: SlateEditor,
  key: string,
  defaultValue: string,
  values: Record<string, unknown>,
) => {
  const { t } = getTranslation(editor);
  announce(t(`plate.accordion.announce.${key}`, { defaultValue, ...values }));
};

/**
 * Inserts an empty paragraph at an index of a panel's content, opens the
 * panel, and opens the slash menu in the paragraph to choose a block.
 */
export const insertInnerBlockAt = (
  editor: SlateEditor,
  contentPath: Path,
  index: number,
) => {
  setPanelOpen(editor, PathApi.parent(contentPath), true);
  const at = [...contentPath, index];
  editor.tf.insertNodes(createEmptyParagraph(), { at });
  editor.tf.select(editor.api.start(at));
  editor.tf.focus();
  // Opens the slash menu in the new block, as typing "/" there would, but
  // without the "/": closing the menu leaves the block empty.
  if (KEYS.slashInput in editor.plugins) {
    editor.tf.insertNodes(
      {
        type: editor.getType(KEYS.slashInput),
        withoutTrigger: true,
        children: [{ text: '' }],
      },
      { select: true },
    );
  }
};

/** Moves a block of a panel up (`-1`) or down (`1`) within the panel. */
export const moveInnerBlock = (
  editor: SlateEditor,
  blockPath: Path,
  delta: -1 | 1,
): boolean => {
  const content = getContent(editor, blockPath);
  if (!content) return false;
  const index = blockPath.at(-1)!;
  const target = index + delta;
  const total = content[0].children.length;
  if (target < 0 || target >= total) return false;

  editor.tf.moveNodes({ at: blockPath, to: [...content[1], target] });
  announceBlock(
    editor,
    'blockMoved',
    'Block moved to position {{position}} of {{total}}',
    { position: target + 1, total },
  );
  return true;
};

const withNewIds = <T>(node: T): T => {
  if (!node || typeof node !== 'object') return node;
  const copy: Record<string, unknown> = { ...(node as object) };
  if (typeof copy.id === 'string') copy.id = nanoid();
  if (Array.isArray(copy.children)) {
    copy.children = copy.children.map((child) => withNewIds(child));
  }
  return copy as T;
};

/** Inserts a copy of a block of a panel after it. */
export const duplicateInnerBlock = (editor: SlateEditor, blockPath: Path) => {
  if (!getContent(editor, blockPath)) return;
  const node = editor.api.node(blockPath)?.[0];
  if (!node) return;

  const at = PathApi.next(blockPath);
  editor.tf.insertNodes(withNewIds(node) as TElement, { at });
  editor.tf.select(editor.api.start(at));
  announceBlock(editor, 'blockDuplicated', 'Block duplicated', {});
};

/**
 * Removes a block of a panel and offers to undo it. The selection goes to the
 * block before it; a panel left without blocks gets an empty paragraph.
 */
export const removeInnerBlock = (editor: SlateEditor, blockPath: Path) => {
  const content = getContent(editor, blockPath);
  if (!content) return;
  const node = editor.api.node(blockPath)?.[0];
  const label = blockLabel(editor, node);
  const { t } = getTranslation(editor);
  const index = blockPath.at(-1)!;

  editor.tf.removeNodes({ at: blockPath });
  const contentNode = editor.api.node(content[1])?.[0] as TElement | undefined;
  if (!contentNode?.children.some((child) => ElementApi.isElement(child))) {
    editor.tf.insertNodes(createEmptyParagraph(), { at: [...content[1], 0] });
  }
  const previous = [...content[1], Math.max(0, index - 1)];
  if (editor.api.node(previous)) {
    editor.tf.select(
      index > 0 ? editor.api.end(previous) : editor.api.start(previous),
    );
  }

  showUndoToast(
    editor,
    t('plate.accordion.blockDeleted', {
      defaultValue: '{{type}} block deleted',
      type: label,
    }),
  );
  announceBlock(editor, 'blockDeleted', '{{type}} block deleted', {
    type: label,
  });
};

const isTextBlock = (editor: SlateEditor, node: TElement) =>
  !editor.api.isVoid(node) &&
  node.children.every(
    (child) =>
      TextApi.isText(child) ||
      (ElementApi.isElement(child) && editor.api.isInline(child)),
  );

/** The block types a block of a panel can be turned into. */
export const getTurnIntoOptions = (editor: SlateEditor, node: TElement) => {
  const current = getInnerBlockId(node);
  return getAvailableInnerBlocks(editor).filter(
    (id) => id !== current || (id === KEYS.p && !!node.listStyleType),
  );
};

/**
 * Turns a block of a panel into another type. Text keeps its text when it
 * becomes a paragraph; any other change starts the new block empty.
 */
export const turnIntoInnerBlock = (
  editor: SlateEditor,
  blockPath: Path,
  id: string,
) => {
  const node = editor.api.node(blockPath)?.[0] as TElement | undefined;
  if (!node || !getContent(editor, blockPath)) return;

  editor.tf.withoutNormalizing(() => {
    if (id === KEYS.p && isTextBlock(editor, node)) {
      editor.tf.unsetNodes([KEYS.listType, 'indent', 'checked'], {
        at: blockPath,
      });
      editor.tf.setNodes({ type: KEYS.p }, { at: blockPath });
      return;
    }

    editor.tf.removeNodes({ at: blockPath });
    if (id === KEYS.table) {
      insertTable(editor, {}, { at: blockPath, select: true });
      return;
    }
    const block: TElement =
      id === KEYS.p || id === KEYS.hr
        ? { type: id, children: [{ text: '' }] }
        : { type: PLONE_BLOCK_TYPE, '@type': id, children: [{ text: '' }] };
    editor.tf.insertNodes(block, { at: blockPath });
  });
  editor.tf.select(editor.api.start(blockPath));

  announceBlock(editor, 'blockChanged', 'Block changed to {{type}}', {
    type: getInnerBlockLabel(id, getTranslation(editor).t),
  });
};
