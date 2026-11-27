import path from 'node:path';
import { coverageConfigDefaults, defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
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
  resolve: {
    tsconfigPaths: true,
    // The tests don't run the Plone registry Vite plugin: point its add-on
    // loaders to the files that `init-loaders` generates before the tests.
    alias: {
      '@plone/registry/addons-loader-server': path.resolve(
        import.meta.dirname,
        '.plone/registry.loader.server.js',
      ),
      '@plone/registry/addons-loader': path.resolve(
        import.meta.dirname,
        '.plone/registry.loader.js',
      ),
    },
  },
});
