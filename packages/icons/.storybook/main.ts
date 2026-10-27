import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import { PloneSVGRVitePlugin } from '../vite-plugin-svgr';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-docs'],
  features: {
    actions: false,
  },
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  staticDirs: ['./public'],
  docs: {},
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      compilerOptions: {
        allowSyntheticDefaultImports: false,
        esModuleInterop: false,
      },
      propFilter: (prop) => {
        if (process.env.NODE_ENV === 'production') return true;
        if (!prop.parent || !prop.parent.fileName) return true;
        const file = prop.parent.fileName;
        return (
          /packages[\\/]icons[\\/]src/.test(file) && !/node_modules/.test(file)
        );
      },
    },
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      plugins: [PloneSVGRVitePlugin()],
      resolve: {
        tsconfigPaths: true,
        alias: [
          // The SVGR template imports `Icon` from the package itself.
          {
            find: /^@plone\/icons$/,
            replacement: new URL('../src/index.ts', import.meta.url).pathname,
          },
        ],
      },
      build: {
        minify: false,
      },
    });
  },
};
export default config;
