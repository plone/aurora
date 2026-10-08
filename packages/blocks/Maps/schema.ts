import type { BlockSchemaArgs, JSONSchema } from '@plone/types';

export function MapsSchema(_args: BlockSchemaArgs = {}): JSONSchema {
  return {
    title: 'Maps',
    fieldsets: [
      {
        id: 'default',
        title: 'Default',
        fields: ['url', 'title'],
      },
    ],
    properties: {
      url: {
        title: 'Maps URL',
        widget: 'url',
      },
      title: {
        title: 'Map title',
      },
    },
    required: [],
  };
}
