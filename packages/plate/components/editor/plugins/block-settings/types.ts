import type { ComponentType } from 'react';
import type { NodeEntry, Path, SlateEditor, TElement } from 'platejs';

import type { TranslateFunction } from '../i18n';

export const BLOCK_SETTINGS_KEY = 'blockSettings';

/** The level above every block: the page. */
export const PAGE_SETTINGS_TARGET = 'page';

/** A node whose settings were chosen, found by its type and ID. */
export type NodeSettingsTarget = { type: string; id: string };

/**
 * What the settings show: a node, or the page, chosen with a settings
 * button, a breadcrumb or Esc.
 */
export type SettingsTarget =
  NodeSettingsTarget | { type: typeof PAGE_SETTINGS_TARGET };

export type NodeSettingsProps = { node: TElement; path: Path };

/**
 * Declares that a node type has settings, and so is a selection level. A
 * plugin declares it in its `settings` option.
 */
export type NodeSettingsDeclaration = {
  /** The level's name in breadcrumbs, such as "Accordion" or "Column 2". */
  label: (t: TranslateFunction, node: TElement, editor: SlateEditor) => string;
  /**
   * How the place of the blocks inside this level reads in "Block 1 of 3 in
   * …", such as "“Opening hours”". Defaults to the label.
   */
  placeLabel?: (
    t: TranslateFunction,
    node: TElement,
    editor: SlateEditor,
  ) => string;
  /** The settings form. Without one, the level has no form of its own. */
  component?: ComponentType<NodeSettingsProps>;
  /**
   * Moves the caret where it belongs when the level is selected, such as the
   * end of a panel's title. By default the caret stays where it is.
   */
  select?: (editor: SlateEditor, path: Path) => void;
  /**
   * A level that the selection implies when no target was chosen, such as
   * the panel whose title holds the caret.
   */
  fromSelection?: (editor: SlateEditor) => NodeEntry<TElement> | undefined;
};

/** A selection level: a node with settings above, or at, a path. */
export type SettingsLevel = {
  type: string;
  id: string;
  path: Path;
  node: TElement;
  label: string;
};
