import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import { insertTable } from '@platejs/table';
import {
  KEYS,
  PathApi,
  type Path,
  type SlateEditor,
  type TElement,
} from 'platejs';

import { announce } from '../../../../lib/announce';
import {
  getInnerBlockLabel,
  getSlotOfBlock,
  isTextLikeBlock,
} from '../containers';
import { getTranslation } from '../i18n';
import { setPanelOpen } from './editor-transforms';
import {
  createEmptyParagraph,
  getAvailableInnerBlocks,
  getInnerBlockId,
} from './transforms';

export {
  duplicateInnerBlock,
  getBlockLabel,
  getInnerBlockEntry,
  getInnerBlockLabel,
  isInnerBlockPath,
  moveInnerBlock,
  removeInnerBlock,
} from '../containers';

/*
 * Operations on the blocks of an accordion panel: the block toolbar, the
 * insert points and "Turn into".
 */

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
  if (!node || !getSlotOfBlock(editor, blockPath)) return;

  editor.tf.withoutNormalizing(() => {
    if (id === KEYS.p && isTextLikeBlock(editor, node)) {
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
