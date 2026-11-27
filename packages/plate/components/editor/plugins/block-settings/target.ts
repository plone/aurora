import {
  ElementApi,
  RangeApi,
  type NodeEntry,
  type Path,
  type SlateEditor,
  type TElement,
  type TRange,
} from 'platejs';

import { getTranslation } from '../i18n';
import {
  BLOCK_SETTINGS_KEY,
  PAGE_SETTINGS_TARGET,
  type NodeSettingsDeclaration,
  type NodeSettingsTarget,
  type SettingsLevel,
  type SettingsTarget,
} from './types';

type EditorWithOptions = SlateEditor & {
  getOption: (plugin: { key: string }, key: string) => any;
  setOption: (plugin: { key: string }, key: string, value: any) => void;
};

const plugin = { key: BLOCK_SETTINGS_KEY };

/** The selection when each editor's settings target was chosen. */
const targetSelections = new WeakMap<SlateEditor, TRange | null>();

/** Chooses what the settings show: a node, the page, or nothing (`null`). */
export const setSettingsTarget = (
  editor: SlateEditor,
  target: SettingsTarget | null,
) => {
  targetSelections.set(editor, editor.selection);
  try {
    (editor as EditorWithOptions).setOption(plugin, 'target', target);
  } catch {
    // The editor has no block settings plugin.
  }
};

export const getSettingsTarget = (
  editor: SlateEditor,
): SettingsTarget | null => {
  try {
    return (editor as EditorWithOptions).getOption(plugin, 'target') ?? null;
  } catch {
    return null;
  }
};

/**
 * Whether the selection moved since the settings target was chosen. Moves
 * made with the choice, such as Esc putting the caret in a panel's title,
 * don't count.
 */
export const selectionMovedSinceTarget = (editor: SlateEditor) => {
  const chosenAt = targetSelections.get(editor);
  const selection = editor.selection;
  if (!chosenAt || !selection) return chosenAt !== selection;
  return !RangeApi.equals(chosenAt, selection);
};

/** The settings a node type declares in its plugin's `settings` option. */
export const getNodeSettings = (
  editor: Pick<SlateEditor, 'plugins'>,
  type: unknown,
): NodeSettingsDeclaration | undefined =>
  typeof type === 'string'
    ? (
        editor.plugins?.[type]?.options as {
          settings?: NodeSettingsDeclaration;
        }
      )?.settings
    : undefined;

/** Finds the node of a settings target by its type and ID. */
export const findSettingsTargetEntry = (
  editor: SlateEditor,
  target: SettingsTarget | null,
): NodeEntry<TElement> | undefined =>
  !target || target.type === PAGE_SETTINGS_TARGET
    ? undefined
    : editor.api.node<TElement>({
        at: [],
        match: (node) =>
          ElementApi.isElement(node) &&
          node.type === target.type &&
          node.id === (target as NodeSettingsTarget).id,
      });

const toLevel = (
  editor: SlateEditor,
  node: TElement,
  path: Path,
  declaration: NodeSettingsDeclaration,
): SettingsLevel => ({
  type: node.type,
  id: String(node.id ?? ''),
  path,
  node,
  label: declaration.label(getTranslation(editor).t, node, editor),
});

/**
 * The selection levels above a path, from the outermost one in: the nodes
 * with settings that hold it. With `includeSelf`, the node at the path counts
 * too.
 */
export const getSettingsLevels = (
  editor: SlateEditor,
  path: Path,
  { includeSelf = false }: { includeSelf?: boolean } = {},
): SettingsLevel[] => {
  const levels: SettingsLevel[] = [];
  const end = includeSelf ? path.length : path.length - 1;
  for (let depth = 1; depth <= end; depth += 1) {
    const at = path.slice(0, depth);
    const node = editor.api.node(at)?.[0];
    if (!ElementApi.isElement(node)) continue;
    const declaration = getNodeSettings(editor, node.type);
    if (declaration) levels.push(toLevel(editor, node, at, declaration));
  }
  return levels;
};

/**
 * The node whose settings show: the chosen target, if it still exists, or
 * else a level the selection implies, such as a panel whose title holds the
 * caret.
 */
export const getSettingsEntry = (
  editor: SlateEditor,
): NodeEntry<TElement> | undefined => {
  const target = getSettingsTarget(editor);
  if (target?.type === PAGE_SETTINGS_TARGET) return undefined;
  if (target) {
    const entry = findSettingsTargetEntry(editor, target);
    if (entry) return entry;
  }
  for (const item of Object.values(editor.plugins ?? {})) {
    const fromSelection = (
      item?.options as { settings?: NodeSettingsDeclaration }
    )?.settings?.fromSelection;
    const entry = fromSelection?.(editor);
    if (entry) return entry;
  }
  return undefined;
};

/** Selects a level: chooses its settings and moves the caret if it says so. */
export const selectSettingsLevel = (
  editor: SlateEditor,
  node: TElement,
  path: Path,
) => {
  getNodeSettings(editor, node.type)?.select?.(editor, path);
  setSettingsTarget(editor, { type: node.type, id: String(node.id) });
};

/**
 * The outermost level around the settings that show, or around the
 * selection: the block the settings belong to, such as an accordion.
 */
export const getOutermostSettingsLevel = (
  editor: SlateEditor,
): SettingsLevel | undefined => {
  const entry = getSettingsEntry(editor);
  const path = entry?.[1] ?? editor.selection?.anchor.path;
  if (!path) return undefined;
  return getSettingsLevels(editor, path, { includeSelf: !!entry })[0];
};

/** The control that sent the keyboard focus into each editor's settings. */
const settingsOrigins = new WeakMap<SlateEditor, HTMLElement>();

/**
 * Remembers the control on the canvas, such as a column handle's button,
 * that moved the focus into the settings container, so Tab and Shift+Tab
 * from the settings go back next to it.
 */
export const setSettingsOrigin = (
  editor: SlateEditor,
  element: HTMLElement | null,
) => {
  if (element) settingsOrigins.set(editor, element);
  else settingsOrigins.delete(editor);
};

/** The control that moved the focus into the settings, if still on the page. */
export const getSettingsOrigin = (editor: SlateEditor) => {
  const element = settingsOrigins.get(editor);
  return element?.isConnected ? element : undefined;
};
