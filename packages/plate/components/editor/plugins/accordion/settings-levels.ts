import { NodeApi, PathApi, type TElement } from 'platejs';

import type { NodeSettingsDeclaration } from '../block-settings/types';
import type { TranslateFunction } from '../i18n';
import { ACCORDION_PANEL_TITLE_KEY } from './types';

/*
 * The accordion and its panels as selection levels. The editor kit adds
 * their settings forms.
 */

const panelTitle = (node: TElement) => {
  const title = node.children[0];
  return title ? NodeApi.string(title) : '';
};

const titleOrUntitled = (t: TranslateFunction, node: TElement) =>
  panelTitle(node) ||
  t('plate.accordion.untitledPanel', { defaultValue: 'Untitled panel' });

export const accordionSettingsLevel: NodeSettingsDeclaration = {
  label: (t) => t('plate.accordion.label', { defaultValue: 'Accordion' }),
};

export const panelSettingsLevel: NodeSettingsDeclaration = {
  label: (t, node) =>
    t('plate.accordion.panelCrumb', {
      defaultValue: 'Panel “{{title}}”',
      title:
        panelTitle(node) ||
        t('plate.accordion.untitled', { defaultValue: 'Untitled' }),
    }),
  placeLabel: (t, node) =>
    t('plate.accordion.panelPlace', {
      defaultValue: '“{{title}}”',
      title: titleOrUntitled(t, node),
    }),
  // A selected panel has the caret at the end of its title.
  select: (editor, path) => {
    editor.tf.select(editor.api.end([...path, 0]));
  },
  // The caret in a panel's title shows the panel's settings.
  fromSelection: (editor) => {
    const title = editor.api.above({
      match: { type: ACCORDION_PANEL_TITLE_KEY },
    });
    return title
      ? editor.api.node<TElement>(PathApi.parent(title[1]))
      : undefined;
  },
};
