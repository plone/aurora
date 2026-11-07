import type { Controlpanel } from '@plone/types';

/**
 * The id of a control panel: the last segment of its `@id`, as in
 * `/controlpanel/<id>`.
 */
export const controlPanelId = (controlpanel: Pick<Controlpanel, '@id'>) =>
  controlpanel['@id'].split('/').pop() || '';
