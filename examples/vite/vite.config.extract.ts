/* eslint-disable import/no-extraneous-dependencies */
import compiledModule from '@compiled/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Handle CommonJS/ESM interop
const compiled = (compiledModule as any).default || compiledModule;

export default defineConfig({
  plugins: [
    compiled({
      importReact: false, // Using automatic JSX runtime
      extract: true, // Enable CSS extraction
      sortAtRules: true,
      sortShorthand: true,
    }),
    react(),
  ],
});
