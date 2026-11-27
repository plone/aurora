import { reactRouter } from '@react-router/dev/vite';
import path from 'node:path';
import { defineConfig, PluginOption } from 'vite';
import { PloneAuroraVitePlugin } from '@plone/aurora/vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ isSsrBuild }) => {
  const analyze = process.env.ANALYZE === 'true';
  const target = isSsrBuild ? 'server' : 'client';
  const statsDir = path.resolve(import.meta.dirname, 'build', 'stats');

  return {
    plugins: [
      PloneAuroraVitePlugin(),
      reactRouter(),
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
});
