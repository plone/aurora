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
  movePanel,
  type AccordionEditorOptions,
} from './editor-transforms';
import { moveInnerBlock } from './inner-block-transforms';
import {
  ACCORDION_PANEL_CONTENT_KEY,
  ACCORDION_PANEL_TITLE_KEY,
} from './types';

/**
 * Handles a key press in an accordion. Returns `true` when it handled it.
 *
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
  options: { closedPanels: {}, typing: false },
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
  },
});
