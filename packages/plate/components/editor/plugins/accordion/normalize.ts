import {
  ElementApi,
  KEYS,
  nanoid,
  type Path,
  type SlateEditor,
  type TElement,
} from 'platejs';

import { isTextLikeBlock, normalizeSlotBlocks } from '../containers';
import { getAccordionOptions } from './options';
import {
  createAccordionPanel,
  createAccordionPanelContent,
  createAccordionPanelTitle,
} from './transforms';
import {
  ACCORDION_KEY,
  ACCORDION_PANEL_CONTENT_KEY,
  ACCORDION_PANEL_KEY,
  ACCORDION_PANEL_TITLE_KEY,
} from './types';

const isElementOfType = (node: unknown, type: string): node is TElement =>
  ElementApi.isElement(node) && node.type === type;

/** A panel that holds a node found where only panels are allowed. */
const panelFor = (node: TElement) => {
  if (node.type === ACCORDION_PANEL_TITLE_KEY) {
    return {
      ...createAccordionPanel(),
      children: [node, createAccordionPanelContent()],
    };
  }
  if (node.type === ACCORDION_PANEL_CONTENT_KEY) {
    return {
      ...createAccordionPanel(),
      children: [createAccordionPanelTitle(), node],
    };
  }
  return createAccordionPanel({ blocks: [node] });
};

const normalizeAccordion = (
  editor: SlateEditor,
  node: TElement,
  path: Path,
): boolean => {
  const { themes } = getAccordionOptions(editor);
  const defaults: Record<string, unknown> = {};
  if (typeof node.id !== 'string' || !node.id) defaults.id = nanoid();
  if (typeof node.exclusive !== 'boolean') defaults.exclusive = true;
  if (!themes.some((theme) => theme.id === node.theme)) {
    defaults.theme = themes[0]?.id ?? 'white';
  }
  if (Object.keys(defaults).length > 0) {
    editor.tf.setNodes(defaults, { at: path });
    return true;
  }

  if (!node.children.some((child) => ElementApi.isElement(child))) {
    editor.tf.insertNodes(createAccordionPanel(), {
      at: [...path, 0],
    });
    return true;
  }

  const index = node.children.findIndex(
    (child) =>
      ElementApi.isElement(child) && child.type !== ACCORDION_PANEL_KEY,
  );
  if (index >= 0) {
    const childPath = [...path, index];
    editor.tf.withoutNormalizing(() => {
      editor.tf.removeNodes({ at: childPath });
      editor.tf.insertNodes(panelFor(node.children[index] as TElement), {
        at: childPath,
      });
    });
    return true;
  }

  return false;
};

const normalizePanel = (
  editor: SlateEditor,
  node: TElement,
  path: Path,
): boolean => {
  const parent = editor.api.parent(path);
  if (!parent || !isElementOfType(parent[0], ACCORDION_KEY)) {
    const { themes } = getAccordionOptions(editor);
    editor.tf.wrapNodes(
      {
        type: ACCORDION_KEY,
        id: nanoid(),
        exclusive: true,
        theme: themes[0]?.id ?? 'white',
        children: [],
      },
      { at: path },
    );
    return true;
  }

  const defaults: Record<string, unknown> = {};
  if (typeof node.id !== 'string' || !node.id) defaults.id = nanoid();
  if (typeof node.startOpen !== 'boolean') defaults.startOpen = false;
  if (typeof node.anchor !== 'string') defaults.anchor = '';
  if (Object.keys(defaults).length > 0) {
    editor.tf.setNodes(defaults, { at: path });
    return true;
  }

  const [first, second] = node.children;
  if (!isElementOfType(first, ACCORDION_PANEL_TITLE_KEY)) {
    editor.tf.insertNodes(createAccordionPanelTitle(), {
      at: [...path, 0],
    });
    return true;
  }
  if (!isElementOfType(second, ACCORDION_PANEL_CONTENT_KEY)) {
    editor.tf.insertNodes(createAccordionPanelContent(), {
      at: [...path, 1],
    });
    return true;
  }

  if (node.children.length > 2) {
    const extraPath = [...path, 2];
    if (isElementOfType(node.children[2], ACCORDION_PANEL_CONTENT_KEY)) {
      // A second content: its blocks join the panel's content.
      editor.tf.unwrapNodes({ at: extraPath });
      return true;
    }
    editor.tf.moveNodes({
      at: extraPath,
      to: [...path, 1, second.children.length],
    });
    return true;
  }

  return false;
};

const normalizeTitle = (
  editor: SlateEditor,
  node: TElement,
  path: Path,
): boolean => {
  const parent = editor.api.parent(path);
  if (!parent || !isElementOfType(parent[0], ACCORDION_PANEL_KEY)) {
    editor.tf.setNodes({ type: KEYS.p }, { at: path });
    return true;
  }

  if (!isTextLikeBlock(editor, node)) {
    // Titles hold text only: blocks pasted into one become its text.
    const text = editor.api.string(path);
    editor.tf.withoutNormalizing(() => {
      editor.tf.removeNodes({ at: path });
      editor.tf.insertNodes(createAccordionPanelTitle(text), { at: path });
    });
    return true;
  }

  return false;
};

const normalizeContent = (
  editor: SlateEditor,
  node: TElement,
  path: Path,
): boolean => {
  const parent = editor.api.parent(path);
  if (!parent || !isElementOfType(parent[0], ACCORDION_PANEL_KEY)) {
    editor.tf.unwrapNodes({ at: path });
    return true;
  }

  // The blocks of the panel follow the accordion's container rules.
  return normalizeSlotBlocks(editor, node, path);
};

/**
 * Keeps accordions valid: at least one panel, each panel with a title and a
 * content holding at least one block, and only the blocks available in a
 * panel inside it. Text blocks that a panel can't hold become paragraphs,
 * containers leave their blocks in place, and other blocks, such as another
 * accordion, move after the accordion, so no content is lost.
 *
 * Returns `true` when it changed the editor, and the node is normalized again.
 */
export const normalizeAccordionNode = (
  editor: SlateEditor,
  node: unknown,
  path: Path,
): boolean => {
  if (!ElementApi.isElement(node)) return false;

  switch (node.type) {
    case ACCORDION_KEY:
      return normalizeAccordion(editor, node, path);
    case ACCORDION_PANEL_KEY:
      return normalizePanel(editor, node, path);
    case ACCORDION_PANEL_TITLE_KEY:
      return normalizeTitle(editor, node, path);
    case ACCORDION_PANEL_CONTENT_KEY:
      return normalizeContent(editor, node, path);
    default:
      return false;
  }
};
