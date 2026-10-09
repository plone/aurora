import type { ConfigType } from '@plone/registry';
import { contentIcons } from './config/ContentIcons';

export default function install(config: ConfigType) {
  config.settings.contentIcons = contentIcons;
  config.registerRoute({
    type: 'layout',
    file: '@plone/contents/routes/layout.tsx',
    children: [
      {
        type: 'prefix',
        path: '@@contents',
        children: [
          {
            type: 'route',
            path: '*',
            file: '@plone/contents/routes/contents.tsx',
          },
        ],
      },
    ],
  });

  // Resources the Contents view calls (`@`, like the REST API endpoints).
  // Views use `@@`, like `@@contents` above.
  config.registerRoute({
    type: 'prefix',
    path: '@contents',
    skipContent: true,
    children: [
      {
        type: 'route',
        path: 'delete/*',
        file: '@plone/contents/routes/delete.tsx',
      },
      {
        type: 'route',
        path: 'upload/*',
        file: '@plone/contents/routes/upload.tsx',
      },
      {
        type: 'route',
        path: 'rename/*',
        file: '@plone/contents/routes/rename.tsx',
      },
      {
        type: 'route',
        path: 'workflow/*',
        file: '@plone/contents/routes/workflow.tsx',
      },
      {
        type: 'route',
        path: 'tags/*',
        file: '@plone/contents/routes/tags.tsx',
      },
      {
        type: 'route',
        path: 'properties/*',
        file: '@plone/contents/routes/properties.tsx',
      },
      {
        type: 'route',
        path: 'order/*',
        file: '@plone/contents/routes/order.tsx',
      },
      {
        type: 'route',
        path: 'paste/*',
        file: '@plone/contents/routes/paste.tsx',
      },
    ],
  });

  return config;
}
