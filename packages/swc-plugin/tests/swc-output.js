const path = require('path');

const swc = require('@swc/core');

/**
 * Transform code using our SWC plugin
 */
async function transform(code, options = {}) {
  const wasmPath = path.join(__dirname, '..', 'compiled_swc_plugin.wasm');

  const pluginOptions = {
    processXcss: true,
    importSources: ['@compiled/react'],
    strictMode: true, // Enable strict mode
    ...options,
  };

  try {
    const result = await swc.transform(code, {
      filename: 'test.tsx',
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true,
        },
        experimental: {
          plugins: [[wasmPath, pluginOptions]],
        },
      },
    });

    return result.code;
  } catch (error) {
    throw error;
  }
}

// Helper to always return a string snapshot: transformed code or error string
async function transformResultString(code, options = {}) {
  try {
    const output = await transform(code, options);
    return normalizeOutput(output);
  } catch (error) {
    return normalizeOutput(String(error));
  }
}

function normalizeOutput(str) {
  return str.replace(
    /packages\/swc-plugin\/compiled_swc_plugin\.wasm/g,
    'packages/swc-plugin2/compiled_swc_plugin2.wasm'
  );
}

const code = `
    import '@compiled/react';
    <div css={{
      '&:hover': { color: 'blue !important' }
    }} />
`;
const out = await transformResultString(code);
console.log(out);
