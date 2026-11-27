import type { SlateEditor } from 'platejs';

import {
  ACCORDION_KEY,
  type AccordionPluginOptions,
  type AccordionTheme,
} from './types';

export const DEFAULT_ACCORDION_OPTIONS: AccordionPluginOptions = {
  allowedBlocks: ['p', 'table', 'hr', 'image', 'teaser', 'listing'],
  themes: [
    { id: 'white', label: 'White', color: '#ffffff' },
    { id: 'grey', label: 'Grey', color: '#ecebeb' },
  ],
  headingLevel: 3,
};

/** The accordion plugin options, with the defaults for any missing one. */
export const getAccordionOptions = (
  editor: Pick<SlateEditor, 'getOptions'>,
): AccordionPluginOptions => {
  let options: Partial<AccordionPluginOptions> = {};
  try {
    options = editor.getOptions({ key: ACCORDION_KEY }) ?? {};
  } catch {
    // The editor has no accordion plugin.
  }

  return {
    allowedBlocks:
      options.allowedBlocks ?? DEFAULT_ACCORDION_OPTIONS.allowedBlocks,
    themes:
      options.themes && options.themes.length > 0
        ? options.themes
        : DEFAULT_ACCORDION_OPTIONS.themes,
    headingLevel:
      options.headingLevel ?? DEFAULT_ACCORDION_OPTIONS.headingLevel,
  };
};

/** The theme with the given ID, or the first theme. */
export const resolveAccordionTheme = (
  themes: AccordionTheme[],
  id: unknown,
): AccordionTheme =>
  themes.find((theme) => theme.id === id) ??
  themes[0] ??
  DEFAULT_ACCORDION_OPTIONS.themes[0];
