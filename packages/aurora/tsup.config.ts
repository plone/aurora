import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    // Node, loaded by the app's `vite.config.ts`
    vite: 'src/vite.ts',
    // Node, loaded by the app's `react-router.config.ts`
    preset: 'src/preset.ts',
    // Node, loaded by the app's `routes.ts`
    routes: 'src/routes.ts',
    // Node, loaded by `@plone/registry` from the app's `registry.config.ts`
    'registry.config': 'src/registry.config.ts',
    'registry-publicui.config': 'src/registry-publicui.config.ts',
  },
  format: ['esm'],
  dts: true,
  outDir: 'dist',
  clean: true,
});
