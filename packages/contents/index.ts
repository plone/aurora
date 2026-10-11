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
            path: '@@delete/*',
            type: 'route',
            file: '@plone/contents/routes/delete.tsx',
            skipContent: true,
          },
          {
            path: '@@upload/*',
            type: 'route',
            file: '@plone/contents/routes/upload.tsx',
            skipContent: true,
          },
          {
            path: '@@rename/*',
            type: 'route',
            file: '@plone/contents/routes/rename.tsx',
            skipContent: true,
          },
          {
            path: '@@workflow/*',
            type: 'route',
            file: '@plone/contents/routes/workflow.tsx',
            skipContent: true,
          },
          {
            path: '@@tags/*',
            type: 'route',
            file: '@plone/contents/routes/tags.tsx',
            skipContent: true,
          },
          {
            path: '@@properties/*',
            type: 'route',
            file: '@plone/contents/routes/properties.tsx',
            skipContent: true,
          },
          {
            path: '@@order/*',
            type: 'route',
            file: '@plone/contents/routes/order.tsx',
            skipContent: true,
          },
          {
            path: '@@paste/*',
            type: 'route',
            file: '@plone/contents/routes/paste.tsx',
            skipContent: true,
          },
          {
            type: 'route',
            path: '*',
            file: '@plone/contents/routes/contents.tsx',
          },
        ],
      },
    ],
  });

  return config;
}
