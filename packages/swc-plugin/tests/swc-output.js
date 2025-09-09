import * as fs from 'fs';
import * as path from 'path';

import * as swc from '@swc/core';

import * as lib from '..';

function buildSwcOptions(code, options = {}) {
  const wasmPath = path.join(__dirname, '..', 'compiled_swc_plugin2.wasm');
  const pluginOptions = {
    importSources: ['@compiled/react'],
    extract: true,
    ...options,
  };
  // Only enable the plugin when the code includes configured import sources
  const hasCssLikeJsx = /\b(?:css|[A-Za-z]*xcss)\s*=/i.test(code);
  const hasApiCalls = /(cssMap|keyframes)\s*\(|styled\s*(\.|\()/.test(code);
  const enablePlugin =
    options.forceEnable !== undefined ? !!options.forceEnable : hasCssLikeJsx || hasApiCalls;

  const swcOptions = {
    filename: 'test.tsx',
    cwd: process.cwd(),
    jsc: {
      target: 'es2020',
      externalHelpers: true,
      parser: { syntax: 'typescript', tsx: false },
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
  return swcOptions;
}

async function transform(code, options = {}) {
  const result = await swc.transform(code, buildSwcOptions(code, options));
  return result.code;
}

function transformSyncFast(code, options = {}) {
  const result = swc.transformSync(code, buildSwcOptions(code, options));
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

export { transform, transformResultString };
export { transformSyncFast };
