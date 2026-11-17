import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { PloneSVGRVitePlugin } from './vite-plugin-svgr';

export default defineConfig({
  plugins: [PloneSVGRVitePlugin(), react()],
  resolve: {
    tsconfigPaths: true,
  },
});
