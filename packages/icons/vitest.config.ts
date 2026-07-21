import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './setupTesting.ts',
    css: false,
    exclude: ['**/node_modules/**', '**/lib/**'],
  },
});
