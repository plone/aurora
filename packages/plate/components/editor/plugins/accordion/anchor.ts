import { ElementApi, type SlateEditor, type TElement } from 'platejs';

import { ACCORDION_PANEL_KEY } from './types';

/**
 * A slug for a panel anchor: lowercase letters, digits and dashes, such as
 * `opening-hours` for "Opening hours".
 */
export const slugify = (text: string) =>
  text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** The anchor suggested for a panel: its title's slug, or `panel-<n>`. */
export const getAnchorPlaceholder = (title: string, index: number) =>
  slugify(title) || `panel-${index + 1}`;

/**
 * Whether another panel of the document already uses this anchor. Links to
 * an anchor open only one panel, so anchors must be unique.
 */
export const isAnchorTaken = (
  editor: SlateEditor,
  panelId: string,
  anchor: string,
) => {
  if (!anchor) return false;
  for (const [node] of editor.api.nodes<TElement>({
    at: [],
    match: (n) => ElementApi.isElement(n) && n.type === ACCORDION_PANEL_KEY,
  })) {
    if (node.id !== panelId && node.anchor === anchor) return true;
  }
  return false;
};
