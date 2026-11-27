import { createRequire } from 'node:module';
import type { Plugin, PluginOption } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import babel from 'vite-plugin-babel';
import devtoolsJson from 'vite-plugin-devtools-json';
import { PloneDevtoolsVitePlugin } from '@plone/devtools/vite';
import { PloneSVGRVitePlugin } from '@plone/icons/vite-plugin-svgr';
import { PloneRegistryVitePlugin } from '@plone/registry/vite-plugin';

// Babel resolves presets and plugins given by name from the app's folder,
// where a project may not have them: resolve them from this package.
const require = createRequire(import.meta.url);

/**
 * The Vite configuration that every Plone Aurora app needs, besides the
 * plugins.
 */
function ploneAuroraConfig(): Plugin {
  return {
    name: 'plone-aurora:config',
    config: () => ({
      optimizeDeps: {
        // Server-only deps that Vite would otherwise still pick up for the
        // client bundle — keep in sync with ssr.optimizeDeps.include below
        exclude: [
          'i18next-fs-backend',
          'i18next-fs-backend/cjs',
          'remix-i18next',
        ],
        include: [
          // The i18n libraries of the app
          'i18next',
          'i18next-browser-languagedetector',
          'i18next-http-backend',
          'react-i18next',
          // Injected by babel-plugin-react-compiler, not in any package.json
          'react/compiler-runtime',
          // @plone/components, @plone/icons, @plone/quanta and @plone/helpers are
          // not registered add-ons, so their deps can't be declared in
          // vite.extend.js — list them here
          '@plone/components > clsx',
          '@plone/components > react-aria',
          '@plone/components > react-aria-components',
          '@plone/icons > @react-aria/utils',
          '@plone/icons > @react-spectrum/utils',
          '@plone/icons > clsx',
          '@plone/icons > tailwind-variants',
          '@plone/quanta > @internationalized/date',
          '@plone/quanta > clsx',
          '@plone/quanta > react-aria-components',
          '@plone/quanta > react-aria-components/DropZone',
          '@plone/quanta > react-aria-components/Form',
          '@plone/quanta > react-aria-components/Group',
          '@plone/quanta > react-aria-components/Modal',
          '@plone/quanta > react-aria-components/Table',
          '@plone/quanta > react-aria-components/Tooltip',
          '@plone/quanta > react-aria-components/composeRenderProps',
          '@plone/quanta > tailwind-merge',
          '@plone/quanta > tailwind-variants',
          '@plone/quanta > usehooks-ts',
          '@plone/helpers > jotai',
          '@plone/helpers > jotai/utils',
          '@plone/helpers > jotai/vanilla',
          '@plone/helpers > jotai-optics',
        ],
      },
      ssr: {
        optimizeDeps: {
          include: ['i18next-fs-backend/cjs', 'isbot', 'remix-i18next'],
        },
      },
    }),
  };
}

/**
 * The Vite plugins and configuration of a Plone Aurora app. Add it to the
 * app's `vite.config.ts`, before React Router's plugin:
 *
 * ```ts
 * import { reactRouter } from '@react-router/dev/vite';
 * import { PloneAuroraVitePlugin } from '@plone/aurora/vite';
 * import { defineConfig } from 'vite';
 *
 * export default defineConfig({
 *   plugins: [PloneAuroraVitePlugin(), reactRouter()],
 * });
 * ```
 *
 * It includes the Plone registry plugin, which loads the app's add-ons and
 * applies their `vite.extend` files, Tailwind, the React Compiler, SVG
 * imports as components, and the Plone devtools in development (set
 * `PLONE_DEVTOOLS=false` to turn them off).
 */
export function PloneAuroraVitePlugin(): PluginOption[] {
  return [
    // Development only. Set PLONE_DEVTOOLS=false to turn it off.
    ...PloneDevtoolsVitePlugin(),
    PloneSVGRVitePlugin(),
    PloneRegistryVitePlugin(),
    tailwindcss(),
    babel({
      include: /\.tsx?$/,
      exclude: /node_modules/,
      babelConfig: {
        presets: [require.resolve('@babel/preset-typescript')],
        plugins: [require.resolve('babel-plugin-react-compiler')],
      },
    }),
    devtoolsJson(),
    ploneAuroraConfig(),
  ];
}
