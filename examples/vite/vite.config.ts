/* eslint-disable import/no-extraneous-dependencies */
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import compiledVitePlugin from '../../packages/vite-plugin/src/index.js';

export default defineConfig({
  plugins: [
    compiledVitePlugin({
      importReact: false, // Using automatic JSX runtime
    }),
    react(),
  ],
});
