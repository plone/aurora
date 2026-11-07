import {
  ElementApi,
  KEYS,
  PathApi,
  type Path,
  type PluginConfig,
  type SlateEditor,
  type TElement,
} from 'platejs';
import { createTPlatePlugin } from 'platejs/react';

import {
  ACCORDION_EDITOR_KEY,
  enterPanel,
  findAccordionEntry,
  getSettingsTarget,
  movePanel,
  PAGE_SETTINGS_TARGET,
  selectionMovedSinceTarget,
  setSettingsTarget,
  type AccordionEditorOptions,
} from './editor-transforms';
import {
  getInnerBlockEntry,
  isInnerBlockPath,
  moveInnerBlock,
  removeInnerBlock,
} from './inner-block-transforms';
import {
  ACCORDION_KEY,
  ACCORDION_PANEL_CONTENT_KEY,
  ACCORDION_PANEL_KEY,
  ACCORDION_PANEL_TITLE_KEY,
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

/** Shows the settings of a panel, with the caret at the end of its title. */
const selectPanel = (editor: SlateEditor, panelPath: Path) => {
  const panel = editor.api.node<TElement>(panelPath)?.[0];
  if (!panel) return;
  editor.tf.select(editor.api.end([...panelPath, 0]));
  setSettingsTarget(editor, {
    type: ACCORDION_PANEL_KEY,
    id: String(panel.id),
  });
};

/**
 * Esc selects the level above: a block of a panel › its panel › the
 * accordion › the page › nothing. From the text of a block, it selects the
 * block, which the editor's block selection then takes on.
 */
const handleEscape = (editor: SlateEditor): boolean => {
  const target = getSettingsTarget(editor);
  if (target?.type === PAGE_SETTINGS_TARGET) {
    setSettingsTarget(editor, null);
    return true;
  }
  if (target?.type === ACCORDION_KEY) {
    setSettingsTarget(editor, { type: PAGE_SETTINGS_TARGET });
    return true;
  }
  let panelPath: number[] | undefined;
  if (target?.type === ACCORDION_PANEL_KEY) {
    panelPath = findAccordionEntry(editor, target)?.[1];
  } else {
    const title = editor.api.above({
      match: { type: ACCORDION_PANEL_TITLE_KEY },
    });
    if (title) panelPath = PathApi.parent(title[1]);
  }
  if (!panelPath) {
    const block = getInnerBlockEntry(editor);
    if (!block) return false;
    const blockSelection = getBlockSelection(editor);
    if (blockSelection && block[0].id) {
      blockSelection.set(String(block[0].id));
    } else {
      selectPanel(editor, block[1].slice(0, -2));
    }
    return true;
  }
  const accordion = editor.api.node(PathApi.parent(panelPath))?.[0];
  if (!ElementApi.isElement(accordion)) return false;
  setSettingsTarget(editor, {
    type: ACCORDION_KEY,
    id: String(accordion.id),
  });
  return true;
};

/**
 * Handles a key press while the editor's block selection holds one block of
 * an accordion panel: Esc selects its panel, and Delete or Backspace removes
 * it with an Undo notification. Returns `true` when it handled it.
 */
export const handleAccordionBlockSelectionKeyDown = (
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
  if (event.key === 'Escape') selectPanel(editor, blockPath.slice(0, -2));
  else removeInnerBlock(editor, blockPath);
  editor.tf.focus();
  return true;
};

/**
 * Handles a key press in an accordion. Returns `true` when it handled it.
 *
 * - Esc selects the level above: block › panel › accordion › page › nothing.
 * - Enter in a panel title moves into the panel's first block.
 * - Alt+Shift+↑ and Alt+Shift+↓ move the panel, in a panel title, or the
 *   block, in a block of a panel.
 * - The title and the content of a panel never merge: Backspace at the start
 *   of a title, Delete at its end, and Delete at the end of the last block of
 *   a panel do nothing, and Backspace at the start of the first block of a
 *   panel moves to the end of its title.
 */
export const handleAccordionKeyDown = (
  editor: SlateEditor,
  event: Pick<
    KeyboardEvent,
    'key' | 'shiftKey' | 'altKey' | 'preventDefault'
  > & {
    defaultPrevented?: boolean;
  },
): boolean => {
  if (event.defaultPrevented) return false;
  if (event.key === 'Escape') {
    if (!handleEscape(editor)) return false;
    event.preventDefault();
    return true;
  }
  const isMove =
    event.altKey &&
    event.shiftKey &&
    (event.key === 'ArrowUp' || event.key === 'ArrowDown');
  if (!isMove && !['Enter', 'Backspace', 'Delete'].includes(event.key)) {
    return false;
  }
  const selection = editor.selection;
  if (!selection || !editor.api.isCollapsed()) return false;

  const title = editor.api.above({
    match: { type: ACCORDION_PANEL_TITLE_KEY },
  });
  if (title) {
    const [, titlePath] = title;
    const panelPath = PathApi.parent(titlePath);
    if (isMove) {
      event.preventDefault();
      movePanel(editor, panelPath, event.key === 'ArrowUp' ? -1 : 1);
      return true;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      enterPanel(editor, panelPath);
      return true;
    }
    if (
      (event.key === 'Backspace' &&
        editor.api.isStart(selection.anchor, titlePath)) ||
      (event.key === 'Delete' && editor.api.isEnd(selection.anchor, titlePath))
    ) {
      event.preventDefault();
      return true;
    }
    return false;
  }

  if (event.key === 'Enter') return false;

  const block = editor.api.block();
  if (!block) return false;
  const [node, blockPath] = block;
  const parent = editor.api.parent(blockPath);
  if (!parent || !ElementApi.isElement(parent[0])) return false;
  if (parent[0].type !== ACCORDION_PANEL_CONTENT_KEY) return false;

  if (isMove) {
    event.preventDefault();
    moveInnerBlock(editor, blockPath, event.key === 'ArrowUp' ? -1 : 1);
    return true;
  }

  const index = blockPath.at(-1);
  if (
    event.key === 'Backspace' &&
    index === 0 &&
    // List items outdent first, as anywhere else.
    !(node as { indent?: number }).indent &&
    editor.api.isStart(selection.anchor, blockPath)
  ) {
    event.preventDefault();
    const panelPath = PathApi.parent(parent[1]);
    editor.tf.select(editor.api.end([...panelPath, 0]));
    return true;
  }
  if (
    event.key === 'Delete' &&
    index === parent[0].children.length - 1 &&
    editor.api.isEnd(selection.anchor, blockPath)
  ) {
    event.preventDefault();
    return true;
  }

  return false;
};

/** The accordion's editing state and its keyboard handling. */
export const AccordionEditorPlugin = createTPlatePlugin<
  PluginConfig<typeof ACCORDION_EDITOR_KEY, AccordionEditorOptions>
>({
  key: ACCORDION_EDITOR_KEY,
  // Runs before the plugins that merge blocks on Backspace and Delete.
  priority: 200,
  options: { closedPanels: {}, settingsTarget: null, typing: false },
  handlers: {
    onKeyDown: ({ editor, event, getOption, setOption }) => {
      const key = (event as unknown as KeyboardEvent).key;
      const typed =
        (key.length === 1 || key === 'Backspace') &&
        !(event as unknown as KeyboardEvent).metaKey &&
        !(event as unknown as KeyboardEvent).ctrlKey;
      if (
        typed &&
        !getOption('typing') &&
        editor.api.above({ match: { type: ACCORDION_PANEL_CONTENT_KEY } })
      ) {
        setOption('typing', true);
      }
      return handleAccordionKeyDown(editor, event as unknown as KeyboardEvent);
    },
    onMouseMove: ({ getOption, setOption }) => {
      if (getOption('typing')) setOption('typing', false);
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
