import {
  ElementApi,
  PathApi,
  type Path,
  type SlateEditor,
  type TElement,
} from 'platejs';

import { createAccordion, createAccordionPanel } from './transforms';
import {
  ACCORDION_KEY,
  ACCORDION_PANEL_KEY,
  type TAccordionPanelElement,
} from './types';

/*
 * Editing operations. While editing, each panel opens and closes on its own,
 * whatever the accordion's `exclusive` setting: that state belongs to the
 * editor, in the `accordionEditor` plugin options, and is never saved. Panels
 * are open unless closed.
 */

export const ACCORDION_EDITOR_KEY = 'accordionEditor';

export type AccordionEditorOptions = {
  /** The IDs of the panels closed in the editor. */
  closedPanels: Record<string, boolean>;
};

type EditorWithOptions = SlateEditor & {
  getOption: (plugin: { key: string }, key: string) => any;
  setOption: (plugin: { key: string }, key: string, value: any) => void;
};

const plugin = { key: ACCORDION_EDITOR_KEY };

const getClosedPanels = (editor: SlateEditor): Record<string, boolean> => {
  try {
    return (
      (editor as EditorWithOptions).getOption(plugin, 'closedPanels') ?? {}
    );
  } catch {
    return {};
  }
};

const setClosedPanels = (
  editor: SlateEditor,
  closedPanels: Record<string, boolean>,
) => {
  (editor as EditorWithOptions).setOption(plugin, 'closedPanels', closedPanels);
};

export const isPanelOpen = (editor: SlateEditor, panelId: string) =>
  !getClosedPanels(editor)[panelId];

const getPanel = (editor: SlateEditor, panelPath: Path) => {
  const node = editor.api.node(panelPath)?.[0];
  return ElementApi.isElement(node) && node.type === ACCORDION_PANEL_KEY
    ? (node as TAccordionPanelElement)
    : undefined;
};

const isSelectionInside = (editor: SlateEditor, path: Path) => {
  const selection = editor.selection;
  return (
    !!selection &&
    PathApi.isAncestor(path, selection.anchor.path) &&
    PathApi.isAncestor(path, selection.focus.path)
  );
};

/**
 * Opens or closes a panel in the editor. Closing a panel that holds the
 * selection moves the selection to the end of the panel's title.
 */
export const setPanelOpen = (
  editor: SlateEditor,
  panelPath: Path,
  open: boolean,
) => {
  const panel = getPanel(editor, panelPath);
  if (!panel) return;

  const closedPanels = { ...getClosedPanels(editor) };
  if (open) delete closedPanels[panel.id];
  else closedPanels[panel.id] = true;
  setClosedPanels(editor, closedPanels);

  const contentPath = [...panelPath, 1];
  if (!open && isSelectionInside(editor, contentPath)) {
    editor.tf.select(editor.api.end([...panelPath, 0]));
  }
};

/** Opens or closes every panel of an accordion in the editor. */
export const setAllPanelsOpen = (
  editor: SlateEditor,
  accordionPath: Path,
  open: boolean,
) => {
  const accordion = editor.api.node(accordionPath)?.[0] as TElement | undefined;
  if (!accordion || accordion.type !== ACCORDION_KEY) return;

  accordion.children.forEach((_child, index) => {
    setPanelOpen(editor, [...accordionPath, index], open);
  });
};

/**
 * Inserts a new panel at an index of an accordion, open, and puts the caret
 * in its title.
 */
export const insertAccordionPanel = (
  editor: SlateEditor,
  accordionPath: Path,
  index: number,
) => {
  const panelPath = [...accordionPath, index];
  editor.tf.insertNodes(createAccordionPanel(), { at: panelPath });
  editor.tf.select(editor.api.start([...panelPath, 0]));
  editor.tf.focus();
  return panelPath;
};

/**
 * Inserts an accordion after the block that holds the selection, and puts the
 * caret in the title of its first panel.
 */
export const insertAccordion = (editor: SlateEditor) => {
  const block = editor.api.block({ highest: true });
  const at = block ? PathApi.next(block[1]) : [editor.children.length];
  editor.tf.insertNodes(createAccordion(), { at });
  editor.tf.select(editor.api.start([...at, 0, 0]));
};

/** Opens a panel and puts the caret at the start of its first block. */
export const enterPanel = (editor: SlateEditor, panelPath: Path) => {
  if (!getPanel(editor, panelPath)) return;
  setPanelOpen(editor, panelPath, true);
  editor.tf.select(editor.api.start([...panelPath, 1, 0]));
};
