import * as path from 'path';

import * as swc from '@swc/core';

function buildSwcOptions(code: string, options: Record<string, unknown> = {}): Readonly<any> {
  const wasmPath = path.join(__dirname, '..', 'compiled_swc_plugin2.wasm');
  const pluginOptions = {
    importSources: ['@compiled/react'],
    extract: true,
    ...options,
  } as Record<string, unknown>;
  // Only enable the plugin when the code includes configured import sources
  const hasCssLikeJsx = /\b(?:css|[A-Za-z]*xcss)\s*=/i.test(code);
  const hasApiCalls = /(cssMap|keyframes)\s*\(|styled\s*(\.|\()/.test(code);
  const enablePlugin =
    (options as any).forceEnable !== undefined
      ? !!(options as any).forceEnable
      : hasCssLikeJsx || hasApiCalls;

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
                    (pluginOptions as any) && (pluginOptions as any).extractStylesToDirectory
                      ? {
                          filename: 'test.tsx',
                          sourceFileName: '../src/test.tsx',
                        }
                      : {};
                  return { ...(pluginOptions as any), ...extra };
                })(),
              ],
            ],
          }
        : {},
    },
  } as const;
  return swcOptions;
}

async function transform(code: string, options: Record<string, unknown> = {}): Promise<string> {
  const result = await swc.transform(code, buildSwcOptions(code, options));
  return result.code;
}

function transformSyncFast(code: string, options: Record<string, unknown> = {}): string {
  const result = swc.transformSync(code, buildSwcOptions(code, options));
  return result.code;
}

async function transformResultString(
  code: string,
  options: Record<string, unknown> = {}
): Promise<string> {
  try {
    return normalizeOutput(await transform(code, options));
  } catch (e) {
    return normalizeOutput(String(e));
  }
}

function normalizeOutput(str: string): string {
  return str.replace(
    /packages\/swc-plugin2\/compiled_swc_plugin2\.wasm/g,
    'packages/swc-plugin/compiled_swc_plugin2.wasm'
  );
}

export { transform, transformResultString };
export { transformSyncFast };
