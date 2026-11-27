/**
 * The add-ons of a Plone Aurora app, with the public UI and the CMS UI. An app
 * or an add-on repository extends this list in its `registry.config.ts`:
 *
 * ```ts
 * import { addons } from '@plone/aurora/registry.config';
 *
 * addons.push('my-add-on');
 *
 * export { addons };
 * ```
 */
const addons = [
  '@plone/theming',
  '@plone/plate',
  '@plone/blocks',
  '@plone/layout',
  '@plone/cmsui',
  '@plone/publicui',
  '@plone/contents',
  '@plone/controlpanels',
  '@plone/agave',
];
const theme = '';

export { addons, theme };
