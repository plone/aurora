import {
  ElementApi,
  PathApi,
  type PluginConfig,
  type SlateEditor,
} from 'platejs';
import { createTPlatePlugin } from 'platejs/react';

import {
  ACCORDION_EDITOR_KEY,
  enterPanel,
  findAccordionEntry,
  getSettingsTarget,
  movePanel,
  setSettingsTarget,
  type AccordionEditorOptions,
} from './editor-transforms';
import { moveInnerBlock } from './inner-block-transforms';
import {
  ACCORDION_KEY,
  ACCORDION_PANEL_CONTENT_KEY,
  ACCORDION_PANEL_KEY,
  ACCORDION_PANEL_TITLE_KEY,
} from './types';

/**
 * Esc selects the level above in the accordion's settings: a panel's title or
 * settings › the accordion › nothing. Elsewhere, the editor's own Esc (which
 * selects the block) applies.
 */
const handleEscape = (editor: SlateEditor): boolean => {
  const target = getSettingsTarget(editor);
  if (target?.type === ACCORDION_KEY) {
    setSettingsTarget(editor, null);
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
  if (!panelPath) return false;

  const accordion = editor.api.node(PathApi.parent(panelPath))?.[0];
  if (!ElementApi.isElement(accordion)) return false;
  setSettingsTarget(editor, {
    type: ACCORDION_KEY,
    id: String(accordion.id),
  });
  return true;
};

/**
 * Handles a key press in an accordion. Returns `true` when it handled it.
 *
 * - Esc selects the level above: panel › accordion › nothing.
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
    // When the caret moves out of the accordion or panel whose settings show,
    // its settings close, so the host shows what holds the selection.
    onChange: ({ editor }) => {
      const target = getSettingsTarget(editor);
      if (!target || !editor.selection) return;
      const movedSelection = editor.operations.some(
        (operation) => operation.type === 'set_selection',
      );
      if (!movedSelection) return;
      const entry = findAccordionEntry(editor, target);
      if (
        !entry ||
        !PathApi.isAncestor(entry[1], editor.selection.anchor.path)
      ) {
        setSettingsTarget(editor, null);
      }
    },
  },
});
