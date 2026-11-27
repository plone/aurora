import type { TElement, TText } from 'platejs';

export const ACCORDION_KEY = 'accordion';
export const ACCORDION_PANEL_KEY = 'accordion_panel';
export const ACCORDION_PANEL_TITLE_KEY = 'accordion_panel_title';
export const ACCORDION_PANEL_CONTENT_KEY = 'accordion_panel_content';

export type TAccordionPanelTitleElement = TElement & {
  type: typeof ACCORDION_PANEL_TITLE_KEY;
  children: TText[];
};

export type TAccordionPanelContentElement = TElement & {
  type: typeof ACCORDION_PANEL_CONTENT_KEY;
  children: TElement[];
};

export type TAccordionPanelElement = TElement & {
  type: typeof ACCORDION_PANEL_KEY;
  id: string;
  /** Open when the page loads. */
  startOpen: boolean;
  /** A slug: links to `#<anchor>` open this panel. Empty for none. */
  anchor: string;
  children: [TAccordionPanelTitleElement, TAccordionPanelContentElement];
};

export type TAccordionElement = TElement & {
  type: typeof ACCORDION_KEY;
  id: string;
  /** Only one panel open at a time, in the published view. */
  exclusive: boolean;
  /** The ID of one of the `themes` of the plugin options. */
  theme: string;
  children: TAccordionPanelElement[];
};

export type AccordionTheme = {
  id: string;
  label: string;
  /** A CSS color, set as the accordion's background. */
  color: string;
};

export type AccordionHeadingLevel = 2 | 3 | 4 | 5 | 6;

export type AccordionPluginOptions = {
  /**
   * The blocks a panel can hold: Plate.js element types, such as `p`, or the
   * `@type` of Plone blocks, such as `image`. Plone blocks are only available
   * when the editor has the Plone block adapter and the block is registered.
   */
  allowedBlocks: string[];
  /** The backgrounds editors can choose from. The first one is the default. */
  themes: AccordionTheme[];
  /** The heading level of the panel titles in the published view. */
  headingLevel: AccordionHeadingLevel;
  /**
   * Adapts the settings schema of the blocks inside an accordion. It
   * replaces the default rules (see `defaultInnerBlockSchemaEnhancer`).
   */
  innerBlockSchemaEnhancer?: (
    schema: any,
    context: { blockType: string; t: (key: string, options?: any) => string },
  ) => any;
};
