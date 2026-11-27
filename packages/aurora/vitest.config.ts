import { coverageConfigDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      exclude: [
        ...coverageConfigDefaults.exclude,
        'dist/**',
        'src/app/entry.server.tsx',
        'src/app/entry.client.tsx',
        'src/app/i18n.ts',
      ],
    },
  },
});
