import { reactRouter } from '@react-router/dev/vite';
import path from 'node:path';
import { defineConfig, PluginOption } from 'vite';
import { PloneRegistryVitePlugin } from '@plone/registry/vite-plugin';
import { PloneSVGRVitePlugin } from '@plone/components/vite-plugin-svgr';
import applyAddonViteConfiguration from './.plone/vite.loader';
import babel from 'vite-plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';
import devtoolsJson from 'vite-plugin-devtools-json';

export default defineConfig(({ command, mode, isSsrBuild }) => {
  const analyze = process.env.ANALYZE === 'true';
  const target = isSsrBuild ? 'server' : 'client';
  const statsDir = path.resolve(__dirname, 'build', 'stats');

  const baseConfig = {
    plugins: [
      PloneSVGRVitePlugin(),
      PloneRegistryVitePlugin(),
      tailwindcss(),
      reactRouter(),
      babel({
        include: /\.tsx?$/,
        exclude: /node_modules/,
        babelConfig: {
          presets: ['@babel/preset-typescript'],
          plugins: ['babel-plugin-react-compiler'],
        },
      }),
      devtoolsJson(),
      ...(analyze
        ? [
            visualizer({
              filename: path.join(statsDir, `stats-${target}.html`),
              template: 'treemap',
              gzipSize: true,
              brotliSize: true,
            }),
            visualizer({
              filename: path.join(statsDir, `stats-${target}.json`),
              template: 'raw-data',
              gzipSize: true,
              brotliSize: true,
            }),
          ]
        : []),
    ] as PluginOption[],
    optimizeDeps: {
      include: [
        // App-level deps (in apps/aurora/package.json)
        'i18next',
        'i18next-browser-languagedetector',
        'i18next-fs-backend/cjs',
        'i18next-http-backend',
        'react-i18next',
        // Injected by babel-plugin-react-compiler, not in any package.json
        'react/compiler-runtime',
        'remix-i18next/client',
        'remix-i18next/react',
        'remix-i18next/server',
        // @plone/components and @plone/helpers are not registered add-ons, so
        // their deps can't be declared in vite.extend.js — list them here
        '@plone/components > @internationalized/date',
        '@plone/components > @react-aria/utils',
        '@plone/components > @react-spectrum/utils',
        '@plone/components > clsx',
        '@plone/components > react-aria',
        '@plone/components > react-aria-components',
        '@plone/components > react-aria-components/DropZone',
        '@plone/components > react-aria-components/Group',
        '@plone/components > react-aria-components/Modal',
        '@plone/components > react-aria-components/Table',
        '@plone/components > react-aria-components/Tooltip',
        '@plone/components > react-aria-components/composeRenderProps',
        '@plone/components > react-stately',
        '@plone/components > tailwind-merge',
        '@plone/components > tailwind-variants',
        '@plone/helpers > jotai',
        '@plone/helpers > jotai/utils',
        '@plone/helpers > jotai-optics',
      ],
    },
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      port: 3000,
      fs: {
        // Allow serving files from one level up to the project root
        // (required by the Cookieplone setup)
        allow: ['../../../.'],
      },
    },
  };

  return applyAddonViteConfiguration(baseConfig, {
    command,
    mode,
    isSsrBuild,
  });
});
