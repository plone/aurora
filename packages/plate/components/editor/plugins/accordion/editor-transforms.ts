import {
  ElementApi,
  nanoid,
  PathApi,
  type Path,
  type SlateEditor,
  type TElement,
} from 'platejs';

import { announce } from '../../../../lib/announce';
import { showUndoToast } from '../../../../lib/undo-toast';
import { getTranslation } from '../i18n';
import {
  createAccordion,
  createAccordionPanel,
  createAccordionPanelTitle,
} from './transforms';
import {
  ACCORDION_KEY,
  ACCORDION_PANEL_KEY,
  ACCORDION_PANEL_TITLE_KEY,
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
  /** Whether the user is typing in an accordion: the block toolbars hide. */
  typing: boolean;
  /**
   * The accordion or panel whose settings show, chosen with its Settings
   * button, a breadcrumb or Esc. Without one, a panel's settings show while
   * the caret is in its title.
   */
  settingsTarget: AccordionSettingsTarget | null;
};

export type AccordionSettingsTarget = {
  type: typeof ACCORDION_KEY | typeof ACCORDION_PANEL_KEY;
  id: string;
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
  announcePanel(
    editor,
    'panelAdded',
    'Panel added at position {{position}} of {{total}}',
    { position: index + 1, total: panelCount(editor, accordionPath) },
  );
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

const announcePanel = (
  editor: SlateEditor,
  key: string,
  defaultValue: string,
  values: Record<string, unknown> = {},
) => {
  const { t } = getTranslation(editor);
  announce(t(`plate.accordion.announce.${key}`, { defaultValue, ...values }));
};

const panelCount = (editor: SlateEditor, accordionPath: Path) =>
  ((editor.api.node(accordionPath)?.[0] as TElement | undefined)?.children
    .length ?? 0) as number;

/**
 * Moves a panel up (`-1`) or down (`1`) in its accordion. Returns `false` at
 * the ends.
 */
export const movePanel = (
  editor: SlateEditor,
  panelPath: Path,
  delta: -1 | 1,
): boolean => {
  if (!getPanel(editor, panelPath)) return false;
  const accordionPath = PathApi.parent(panelPath);
  const index = panelPath.at(-1)!;
  const target = index + delta;
  const total = panelCount(editor, accordionPath);
  if (target < 0 || target >= total) return false;

  editor.tf.moveNodes({ at: panelPath, to: [...accordionPath, target] });
  announcePanel(
    editor,
    'panelMoved',
    'Panel moved to position {{position}} of {{total}}',
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

/**
 * Inserts a copy of a panel after it: its blocks get new IDs, its title gets
 * " (copy)", its anchor is cleared and it doesn't open when the page loads.
 * The caret goes to the end of the copy's title.
 */
export const duplicatePanel = (editor: SlateEditor, panelPath: Path) => {
  const panel = getPanel(editor, panelPath);
  if (!panel) return;
  const { t } = getTranslation(editor);
  const title = editor.api.string([...panelPath, 0]);

  const copy = withNewIds(panel);
  copy.anchor = '';
  copy.startOpen = false;
  copy.children = [
    createAccordionPanelTitle(
      title
        ? t('plate.accordion.copyTitle', {
            defaultValue: '{{title}} (copy)',
            title,
          })
        : '',
    ),
    copy.children[1],
  ];

  const copyPath = PathApi.next(panelPath);
  editor.tf.insertNodes(copy, { at: copyPath });
  editor.tf.select(editor.api.end([...copyPath, 0]));
  announcePanel(editor, 'panelDuplicated', 'Panel duplicated');
};

/**
 * Removes a panel, unless it's the last one, and offers to undo it. The caret
 * goes to the title of the panel before it, or after it.
 */
export const removePanel = (editor: SlateEditor, panelPath: Path): boolean => {
  if (!getPanel(editor, panelPath)) return false;
  const accordionPath = PathApi.parent(panelPath);
  if (panelCount(editor, accordionPath) < 2) return false;

  const { t } = getTranslation(editor);
  const title = editor.api.string([...panelPath, 0]);
  const index = panelPath.at(-1)!;

  editor.tf.removeNodes({ at: panelPath });
  const neighbour = [...accordionPath, Math.max(0, index - 1)];
  editor.tf.select(editor.api.end([...neighbour, 0]));

  showUndoToast(
    editor,
    t('plate.accordion.panelDeleted', {
      defaultValue: 'Panel “{{title}}” deleted',
      title:
        title ||
        t('plate.accordion.untitledPanel', { defaultValue: 'Untitled panel' }),
    }),
  );
  announcePanel(editor, 'panelDeleted', 'Panel deleted');
  return true;
};

export const setSettingsTarget = (
  editor: SlateEditor,
  target: AccordionSettingsTarget | null,
) => {
  (editor as EditorWithOptions).setOption(plugin, 'settingsTarget', target);
};

export const getSettingsTarget = (
  editor: SlateEditor,
): AccordionSettingsTarget | null => {
  try {
    return (
      (editor as EditorWithOptions).getOption(plugin, 'settingsTarget') ?? null
    );
  } catch {
    return null;
  }
};

/** Finds an accordion or a panel by its ID. */
export const findAccordionEntry = (
  editor: SlateEditor,
  target: AccordionSettingsTarget,
) =>
  editor.api.node<TElement>({
    at: [],
    match: (node) =>
      ElementApi.isElement(node) &&
      node.type === target.type &&
      node.id === target.id,
  });

/**
 * The accordion or panel whose settings show: the chosen target, if it still
 * exists, or else the panel whose title holds the caret.
 */
export const getSettingsEntry = (editor: SlateEditor) => {
  const target = getSettingsTarget(editor);
  if (target) {
    const entry = findAccordionEntry(editor, target);
    if (entry) return entry;
  }
  const title = editor.api.above({
    match: { type: ACCORDION_PANEL_TITLE_KEY },
  });
  if (title) return editor.api.node<TElement>(PathApi.parent(title[1]));
  return undefined;
};

/** Moves a panel to another position of its accordion. */
export const reorderPanel = (
  editor: SlateEditor,
  accordionPath: Path,
  from: number,
  to: number,
) => {
  const total = panelCount(editor, accordionPath);
  if (from === to || from < 0 || to < 0 || from >= total || to >= total) return;
  editor.tf.moveNodes({
    at: [...accordionPath, from],
    to: [...accordionPath, to],
  });
  announcePanel(
    editor,
    'panelMoved',
    'Panel moved to position {{position}} of {{total}}',
    { position: to + 1, total },
  );
};
