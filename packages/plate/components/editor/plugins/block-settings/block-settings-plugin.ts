import {
  KEYS,
  type Path,
  type PluginConfig,
  type SlateEditor,
  type TElement,
} from 'platejs';
import { createTPlatePlugin } from 'platejs/react';

import { announce } from '../../../../lib/announce';
import {
  getInnerBlockEntry,
  isInnerBlockPath,
  removeInnerBlock,
} from '../containers';
import { getTranslation } from '../i18n';
import {
  findSettingsTargetEntry,
  getSettingsEntry,
  getSettingsLevels,
  getSettingsTarget,
  selectionMovedSinceTarget,
  selectSettingsLevel,
  setSettingsTarget,
} from './target';
import {
  BLOCK_SETTINGS_KEY,
  PAGE_SETTINGS_TARGET,
  type SettingsTarget,
} from './types';

type BlockSelectionApi = {
  blockSelection?: {
    deselect: () => void;
    getNodes: (options?: { sort?: boolean }) => [TElement, Path][];
    set: (id: string) => void;
  };
};

const getBlockSelection = (editor: SlateEditor) => {
  try {
    return (editor.getApi({ key: KEYS.blockSelection }) as BlockSelectionApi)
      .blockSelection;
  } catch {
    return undefined;
  }
};

const announceLevel = (editor: SlateEditor, label: string) => {
  const { t } = getTranslation(editor);
  announce(
    t('plate.blockSettings.announce.levelSelected', {
      defaultValue: '{{level}} selected',
      level: label,
    }),
  );
};

/**
 * Selects the closest level above a path, or the page when there is none.
 * Returns `false` when the path has no level above it.
 */
const selectLevelAbove = (editor: SlateEditor, path: Path): boolean => {
  const level = getSettingsLevels(editor, path).at(-1);
  if (!level) return false;
  selectSettingsLevel(editor, level.node, level.path);
  announceLevel(editor, level.label);
  return true;
};

/**
 * Esc selects the level above, one at a time: the text of a block inside a
 * container › the block › its closest level with settings, such as a panel
 * › the container › the page › nothing. A level the selection implies, such
 * as a panel whose title holds the caret, counts as selected. Returns `true`
 * when it handled it.
 */
export const handleSettingsEscape = (editor: SlateEditor): boolean => {
  const target = getSettingsTarget(editor);
  if (target?.type === PAGE_SETTINGS_TARGET) {
    setSettingsTarget(editor, null);
    return true;
  }
  if (target) {
    const entry = findSettingsTargetEntry(editor, target);
    if (entry && selectLevelAbove(editor, entry[1])) return true;
    const { t } = getTranslation(editor);
    setSettingsTarget(editor, { type: PAGE_SETTINGS_TARGET });
    announceLevel(
      editor,
      t('plate.blockSettings.page', { defaultValue: 'Page' }),
    );
    return true;
  }

  // A level the selection implies, such as the panel whose title holds the
  // caret, goes up to its own level above.
  const implied = getSettingsEntry(editor);
  if (implied) {
    if (selectLevelAbove(editor, implied[1])) return true;
    setSettingsTarget(editor, { type: PAGE_SETTINGS_TARGET });
    return true;
  }

  const block = getInnerBlockEntry(editor);
  if (!block) return false;
  const blockSelection = getBlockSelection(editor);
  if (blockSelection && block[0].id) {
    // The editor's block selection takes on the block.
    blockSelection.set(String(block[0].id));
    return true;
  }
  return selectLevelAbove(editor, block[1]);
};

/**
 * Handles a key press while the editor's block selection holds one block
 * inside a container: Esc selects the level above it, and Delete or
 * Backspace removes it with an Undo notification. Returns `true` when it
 * handled it.
 */
export const handleSettingsBlockSelectionKeyDown = (
  editor: SlateEditor,
  event: Pick<KeyboardEvent, 'key' | 'preventDefault'>,
): boolean => {
  if (!['Escape', 'Delete', 'Backspace'].includes(event.key)) return false;
  const blockSelection = getBlockSelection(editor);
  const entries = blockSelection?.getNodes({ sort: true }) ?? [];
  if (entries.length !== 1 || !isInnerBlockPath(editor, entries[0][1])) {
    return false;
  }
  const [, blockPath] = entries[0];
  event.preventDefault();
  // With nothing selected, the block selection's own handling stops here.
  blockSelection!.deselect();
  if (event.key === 'Escape') selectLevelAbove(editor, blockPath);
  else removeInnerBlock(editor, blockPath);
  editor.tf.focus();
  return true;
};

export type BlockSettingsConfig = PluginConfig<
  typeof BLOCK_SETTINGS_KEY,
  {
    /**
     * What the settings show: a node, or the page, chosen with a settings
     * button, a breadcrumb or Esc. It lives outside the editor's value.
     */
    target: SettingsTarget | null;
  }
>;

/**
 * The shared selection levels of nodes that declare settings: the chosen
 * target, Esc to the level above, and closing the target when the user
 * moves the caret.
 */
export const BlockSettingsPlugin = createTPlatePlugin<BlockSettingsConfig>({
  key: BLOCK_SETTINGS_KEY,
  // Runs after the blocks' own keyboard handling, such as the accordion's.
  priority: 150,
  options: { target: null },
  handlers: {
    onKeyDown: ({ editor, event }) => {
      const keyboardEvent = event as unknown as KeyboardEvent;
      if (keyboardEvent.key !== 'Escape' || keyboardEvent.defaultPrevented) {
        return false;
      }
      if (!handleSettingsEscape(editor)) return false;
      keyboardEvent.preventDefault();
      return true;
    },
    // When the user moves the caret, such as with a click on a block, the
    // chosen settings close, so the host shows what holds the selection.
    onChange: ({ editor }) => {
      const target = getSettingsTarget(editor);
      if (!target || !editor.selection) return;
      const movedSelection = editor.operations.some(
        (operation) => operation.type === 'set_selection',
      );
      if (movedSelection && selectionMovedSinceTarget(editor)) {
        setSettingsTarget(editor, null);
      }
    },
  },
});
