import path from 'node:path';
import { coverageConfigDefaults, defineConfig } from 'vitest/config';
import { createBlocksDocsLoader } from '@plone/registry/create-blocks-docs-loader';

// The block docs of the core packages, as the app build collects them.
const blocksDocsLoaderPath = createBlocksDocsLoader([
  path.resolve(__dirname, '../plate'),
  path.resolve(__dirname, '../blocks'),
]);

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@plone/registry/blocks-docs': blocksDocsLoaderPath,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './setupTesting.ts',
    // you might want to disable it, if you don't have tests that rely on CSS
    // since parsing CSS is slow
    // css: true,
    exclude: ['**/node_modules/**', '**/lib/**', '**/acceptance/**'],
    coverage: {
      exclude: [
        ...coverageConfigDefaults.exclude,
        'packages/**',
        'build/**',
        '*.config.ts',
        '.plone/**',
        'app/entry.server.tsx',
        'app/entry.client.tsx',
        'app/i18next.server.ts',
        'app/i18n.ts',
        'app/routes.ts',
      ],
    },
  },
});
