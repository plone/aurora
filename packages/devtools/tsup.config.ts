import { defineConfig } from 'tsup';

export default defineConfig({
  // Three entry points with different runtimes:
  // - `vite`: Node, loaded by the app's `vite.config.ts`
  // - `server`: Node, loaded by `entry.server.tsx` in development
  // - `client`: browser, loaded by `entry.client.tsx` in development
  entry: {
    vite: 'src/vite.ts',
    server: 'src/server/index.ts',
    client: 'src/client/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  outDir: 'dist',
  clean: true,
  external: ['virtual:react-router/server-build'],
});
