const fs = require('fs');
const path = require('path');

const swc = require('@swc/core');

const lib = require('..');

async function transform(code, options = {}) {
  const wasmPath = path.join(__dirname, '..', 'compiled_swc_plugin2.wasm');
  const pluginOptions = {
    importSources: ['@compiled/react'],
    extract: true,
    ...options,
  };
  // Only enable the plugin when the code includes configured import sources
  const hasCssLikeJsx = /\b(?:css|[A-Za-z]*xcss)\s*=/i.test(code);
  const hasApiCalls = /(cssMap|styled|keyframes)\s*\(/.test(code);
  const hasImports = lib.shouldEnableForCode2
    ? lib.shouldEnableForCode2(code, pluginOptions)
    : pluginOptions.importSources.some((s) => code.includes(s));
  const enablePlugin =
    options.forceEnable !== undefined
      ? !!options.forceEnable
      : hasImports || hasCssLikeJsx || hasApiCalls;

  const swcOptions = {
    filename: 'test.tsx',
    cwd: process.cwd(),
    jsc: {
      target: 'es2020',
      externalHelpers: true,
      parser: { syntax: 'typescript', tsx: true },
      experimental: enablePlugin
        ? {
            plugins: [
              [
                wasmPath,
                (() => {
                  const extra =
                    pluginOptions && pluginOptions.extractStylesToDirectory
                      ? {
                          filename: 'test.tsx',
                          sourceFileName: '../src/test.tsx',
                        }
                      : {};
                  return { ...pluginOptions, ...extra };
                })(),
              ],
            ],
          }
        : {},
    },
  };
  const result = await swc.transform(code, swcOptions);
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
    'packages/swc-plugin/compiled_swc_plugin2.wasm'
  );
}

module.exports = { transform, transformResultString };
