# Integrating @compiled/vite-plugin

## For Development/Testing (Without Publishing)

Since the package isn't published yet, you can test it in your project using a file path:

### Option 1: Using yarn link (Recommended for monorepos)

```bash
# In the compiled repo
cd packages/vite-plugin
yarn link

# In your project
cd ~/your-project
yarn link "@compiled/vite-plugin"
```

### Option 2: Using file: protocol

```bash
cd ~/your-project
yarn add file:../compiled/packages/vite-plugin
```

### Option 3: Direct import (Simplest for testing)

In your `vite.config.ts`:

```typescript
import compiledVitePlugin from '../../compiled/packages/vite-plugin/src/index';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    compiledVitePlugin({
      importReact: false, // Use when using automatic JSX runtime
    }),
    react(),
  ],
});
```

## Integration with AFM Template

The AFM template uses Atlaskit components which internally use `@compiled/react`. To enable the Vite plugin:

1. Add the plugin to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compiledVitePlugin from '@compiled/vite-plugin';

export default defineConfig({
  plugins: [
    compiledVitePlugin({
      importReact: false, // AFM uses automatic JSX runtime
      ssr: false,
    }),
    react(),
    // ... other plugins
  ],
  // ... rest of config
});
```

2. The plugin will automatically transform any `@compiled/react` usage in your code and in Atlaskit components.

## Configuration Options

All options from webpack-loader and parcel-transformer are supported:

```typescript
compiledVitePlugin({
  bake: true, // Transform code (default: true)
  extract: false, // Extract CSS (default: false, auto-disabled in dev)
  importReact: false, // Import React if not found
  ssr: false, // Server-side rendering mode
  addComponentName: false, // Add component names as classes
  optimizeCss: true, // Run cssnano normalization
  nonce: undefined, // CSP nonce for inline styles
  importSources: [], // Custom import sources to compile
  classHashPrefix: '', // Prefix for generated class hashes
});
```

## Troubleshooting

### Plugin order matters

The Compiled plugin must come **before** the React plugin:

```typescript
// ✅ Correct
plugins: [compiledVitePlugin(), react()];

// ❌ Wrong
plugins: [react(), compiledVitePlugin()];
```

### TypeScript errors in Compiled packages

If you see TypeScript errors when building, this is expected due to pre-existing issues in the Compiled repo. The plugin uses ts-node to transpile on-the-fly, so it still works.

### Module not found errors

If you see "Cannot find module '@compiled/css/dist/index.js'", make sure the helper `index.js` files exist in:

- `packages/css/index.js`
- `packages/utils/index.js`
- `packages/react/index.js`

These files enable source-to-source transformation without building.
