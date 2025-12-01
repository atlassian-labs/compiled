# @compiled/vite-plugin

Vite plugin for Compiled.

## Installation

```bash
npm install @compiled/vite-plugin
```

## Usage

Add the plugin to your `vite.config.js` or `vite.config.ts`:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compiled from '@compiled/vite-plugin';

export default defineConfig({
  plugins: [compiled(), react()],
});
```

**Important:** The Compiled plugin should be placed **before** the React plugin to ensure proper transformation order.

## Configuration

The plugin accepts the following options:

```ts
interface CompiledVitePluginOptions {
  bake?: boolean; // Transform code using Compiled (default: true)
  extract?: boolean; // Extract CSS to separate files (default: false)
  importReact?: boolean; // Import React if not found (default: true)
  optimizeCss?: boolean; // Run cssnano normalization (default: true)
  nonce?: string; // CSP nonce for inline styles
  extensions?: string[]; // File extensions to process
  parserBabelPlugins?: ParserPlugin[]; // Babel parser plugins
  transformerBabelPlugins?: PluginItem[]; // Babel transformer plugins
  ssr?: boolean; // Server-side rendering mode (default: false)
  addComponentName?: boolean; // Add component names as classes (default: false)
  classNameCompressionMap?: object; // Compressed class name mapping
  extractStylesToDirectory?: { source: string; dest: string };
  resolver?: string; // Custom module resolver
  importSources?: string[]; // Custom import sources to compile
  classHashPrefix?: string; // Prefix for generated class hashes
}
```

### Examples

**Basic usage:**

```js
export default defineConfig({
  plugins: [compiled(), react()],
});
```

**With custom configuration:**

```js
export default defineConfig({
  plugins: [
    compiled({
      ssr: false,
      addComponentName: true,
      importReact: false, // When using automatic JSX runtime
    }),
    react({ jsxRuntime: 'automatic' }),
  ],
});
```

**With CSS extraction (production builds):**

```js
export default defineConfig({
  plugins: [
    compiled({
      extract: true, // Extracts all CSS to a single compiled.css file
      sortAtRules: true, // Sort media queries (default: true)
      sortShorthand: true, // Sort shorthand properties (default: true)
    }),
    react(),
  ],
});
```

## How it works

The plugin transforms CSS-in-JS code from Compiled at build time using Babel:

1. **Development mode (runtime)**:

   - Detects files using Compiled imports (`@compiled/react`)
   - Parses the code into an AST using Babel
   - Transforms the AST using `@compiled/babel-plugin`
   - Returns transformed code with runtime CSS injection

2. **Production mode (with extraction)**:
   - Transforms the code using `@compiled/babel-plugin-strip-runtime`
   - Collects all style rules during transformation
   - Scans `node_modules` for distributed `.compiled.css` files
   - Combines and sorts all styles
   - Emits a single `compiled.css` file
   - Automatically injects CSS link into HTML

## Features

- Zero-runtime CSS-in-JS
- Atomic CSS generation
- TypeScript support
- Source map support
- SSR support
- CSS extraction (production builds)
- HMR (Hot Module Replacement) compatible

## Troubleshooting

### Plugin order matters

Make sure the Compiled plugin comes **before** the React plugin:

```js
// ✅ Correct
plugins: [compiled(), react()];

// ❌ Wrong
plugins: [react(), compiled()];
```

### Development vs Production

CSS extraction is automatically disabled in development mode for better HMR performance. To test extraction behavior, run a production build:

```bash
npm run build
```

## More Information

Detailed documentation and examples can be [found on the documentation website](https://compiledcssinjs.com).
