import {
  createSlatePlugin,
  createTSlatePlugin,
  KEYS,
  TextApi,
  type PluginConfig,
  type TElement,
} from 'platejs';

import { normalizeAccordionNode } from './normalize';
import { DEFAULT_ACCORDION_OPTIONS } from './options';
import {
  ACCORDION_KEY,
  ACCORDION_PANEL_CONTENT_KEY,
  ACCORDION_PANEL_KEY,
  ACCORDION_PANEL_TITLE_KEY,
  type AccordionPluginOptions,
} from './types';

export type AccordionConfig = PluginConfig<
  typeof ACCORDION_KEY,
  AccordionPluginOptions
>;

/**
 * The accordion: a list of panels, each with a title and its own blocks.
 *
 * Configure it with `AccordionPlugin.configure({ options })`: the blocks a
 * panel can hold (`allowedBlocks`), the backgrounds (`themes`) and the
 * heading level of the titles (`headingLevel`).
 */
export const BaseAccordionPlugin = createTSlatePlugin<AccordionConfig>({
  key: ACCORDION_KEY,
  node: { isContainer: true, isElement: true },
  options: DEFAULT_ACCORDION_OPTIONS,
}).overrideEditor(({ editor, tf: { normalizeNode } }) => ({
  transforms: {
    normalizeNode(entry, options) {
      const [node, path] = entry;
      if (normalizeAccordionNode(editor, node, path)) return;
      return normalizeNode(entry, options);
    },
  },
}));

export const BaseAccordionPanelPlugin = createSlatePlugin({
  key: ACCORDION_PANEL_KEY,
  node: { isContainer: true, isElement: true, isStrictSiblings: true },
});

export const BaseAccordionPanelTitlePlugin = createSlatePlugin({
  key: ACCORDION_PANEL_TITLE_KEY,
  node: { isElement: true, isStrictSiblings: true },
});

const isEmptyParagraph = (element: TElement | undefined) =>
  !!element &&
  element.type === KEYS.p &&
  element.children.every((child) => TextApi.isText(child) && !child.text);

export const BaseAccordionPanelContentPlugin = createSlatePlugin({
  key: ACCORDION_PANEL_CONTENT_KEY,
  node: { isContainer: true, isElement: true, isStrictSiblings: true },
  inject: {
    isBlock: true,
    nodeProps: {
      // Marks the empty paragraphs of a panel, which the published view
      // doesn't show (see `styles/content.css`).
      transformProps: ({ editor, element, props }) => {
        if (!isEmptyParagraph(element)) return props;
        try {
          const path = editor.api.findPath(element!);
          const parent = path && editor.api.parent(path);
          if (parent?.[0].type !== ACCORDION_PANEL_CONTENT_KEY) return props;
        } catch {
          return props;
        }
        return { ...props, 'data-empty': 'true' };
      },
    },
  },
});
