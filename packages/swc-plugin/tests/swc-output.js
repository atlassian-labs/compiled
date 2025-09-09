import * as fs from 'fs';
import * as path from 'path';

import * as swc from '@swc/core';

import * as lib from '..';

async function transform(code, options = {}) {
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

export { transform, transformResultString };
