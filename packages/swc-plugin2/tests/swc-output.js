const path = require('path');

const swc = require('@swc/core');

async function transform(code, options = {}) {
  const wasmPath = path.join(__dirname, '..', 'compiled_swc_plugin2.wasm');
  const pluginOptions = {
    importSources: ['@compiled/react'],
    extract: true,
    ...options,
  };
  const result = await swc.transform(code, {
    filename: 'test.tsx',
    jsc: {
      target: 'es2020',
      externalHelpers: true,
      parser: { syntax: 'typescript', tsx: true },
      experimental: { plugins: [[wasmPath, pluginOptions]] },
    },
  });
  return result.code;
}

async function transformResultString(code, options = {}) {
  try {
    return normalizeOutput(await transform(code, options));
  } catch (e) {
    return normalizeOutput(String(e));
  }
}

function normalizeOutput(str) {
  return str.replace(
    /packages\/swc-plugin2\/compiled_swc_plugin2\.wasm/g,
    'packages/swc-plugin2/compiled_swc_plugin2.wasm'
  );
}

module.exports = { transform, transformResultString };
