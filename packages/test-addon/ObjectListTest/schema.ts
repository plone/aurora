import type { JSONSchema } from '@plone/types';

/** An action of the site: a link with a title. */
export const actionSchema = {
  title: 'Action',
  fieldsets: [
    { id: 'default', title: 'Default', fields: ['title', 'href', 'newTab'] },
  ],
  properties: {
    title: { title: 'Title' },
    href: { title: 'Target', description: 'A path of the site, or a URL.' },
    newTab: { title: 'Open in a new tab', type: 'boolean', default: false },
  },
  required: ['title'],
};

/** A link to a social network. */
export const socialLinkSchema = {
  title: 'Link',
  fieldsets: [
    { id: 'default', title: 'Default', fields: ['network', 'title', 'href'] },
  ],
  properties: {
    network: {
      title: 'Network',
      choices: [
        ['mastodon', 'Mastodon'],
        ['linkedin', 'LinkedIn'],
        ['github', 'GitHub'],
      ],
    },
    title: { title: 'Title' },
    href: { title: 'Link', widget: 'url' },
  },
  required: ['network', 'href'],
};

/**
 * The settings of the object list test block: one `object_list` field for
 * each layout.
 */
export function ObjectListTestSchema(): JSONSchema {
  return {
    title: 'Object list test',
    fieldsets: [
      { id: 'default', title: 'Default', fields: ['actions', 'links'] },
    ],
    properties: {
      actions: {
        title: 'Site actions',
        description: 'Links shown in the top bar.',
        widget: 'object_list',
        schema: actionSchema,
      },
      links: {
        title: 'Social links',
        description: 'Shown in the footer, in this order.',
        widget: 'object_list',
        schema: socialLinkSchema,
        layout: 'table',
        columns: ['network', 'title', 'href'],
      },
    },
    required: [],
  } as JSONSchema;
}
