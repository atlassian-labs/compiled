# @compiled/vite-plugin

Vite plugin for Compiled.

## Installation

```bash
npm install @compiled/vite-plugin @compiled/react
```

## Usage

Add the plugin to your `vite.config.ts`:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compiled from '@compiled/vite-plugin';

export default defineConfig({
  plugins: [compiled(), react()],
});
```

**Important:** The Compiled plugin must be placed **before** the React plugin. It is enforced by default via `pre` ordering.

## Configuration

Common options:

```ts
compiled({
  extract: true, // Extract CSS to file (production only)
  importReact: false, // Set false when using automatic JSX runtime
  ssr: false, // Enable SSR mode
  sortAtRules: true, // Sort media queries for extraction
  sortShorthand: true, // Sort shorthand properties for extraction
});
```

## CSS Extraction

Enable CSS extraction for production builds:

```ts
export default defineConfig({
  plugins: [
    compiled({
      extract: true, // Generates compiled.css
    }),
    react(),
  ],
});
```

Extraction is automatically disabled in development for optimal HMR.

## More Information

Detailed documentation and examples can be [found on the documentation website](https://compiledcssinjs.com/docs/pkg-vite-plugin).
