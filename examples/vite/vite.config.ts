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
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      transformerBabelPlugins: [['@babel/plugin-proposal-decorators', { legacy: true }]],
    }),
    react(),
  ],
  optimizeDeps: {
    // Pre-bundle CommonJS fixture packages to convert them to ESM
    include: ['@compiled/babel-component-fixture', '@compiled/babel-component-extracted-fixture'],
  },
  resolve: {
    // Ensure Vite can resolve the fixture packages in the monorepo
    preserveSymlinks: true,
  },
});
