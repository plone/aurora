import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  outDir: 'dist',
  clean: true,
  esbuildOptions(options) {
    options.banner = {
      js: '"use client"',
    };
  },
});
