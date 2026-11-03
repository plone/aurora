import { defineConfig } from 'vitest/config';
import { PloneSVGRVitePlugin } from '@plone/icons/vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [PloneSVGRVitePlugin()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './setupTesting.ts',
    // you might want to disable it, if you don't have tests that rely on CSS
    // since parsing CSS is slow
    css: true,
    exclude: ['**/node_modules/**', '**/lib/**', '**/acceptance/**'],
    passWithNoTests: true,
  },
});
