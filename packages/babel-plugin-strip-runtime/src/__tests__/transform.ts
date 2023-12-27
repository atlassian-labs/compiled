import { transformSync as babelTransformSync } from '@babel/core';
import type { BabelFileResult } from '@babel/core';
import compiledBabelPlugin from '@compiled/babel-plugin';
import { format } from 'prettier';

import stripRuntimeBabelPlugin from '../index';

type TransformOptions = {
  styleSheetPath?: string;
  compiledRequireExclude?: boolean;
  run: 'both' | 'bake' | 'extract';
  runtime: 'automatic' | 'classic';
  extractStylesToDirectory?: { source: string; dest: string };
  babelJSXPragma?: string;
  babelJSXImportSource?: string;
};

export const transformSync = (code: string, opts: TransformOptions): BabelFileResult | null => {
  const { styleSheetPath, compiledRequireExclude, run, runtime, extractStylesToDirectory } = opts;
  const bake = run === 'both' || run === 'bake';
  const extract = run === 'both' || run === 'extract';

  return babelTransformSync(code, {
    babelrc: false,
    configFile: false,
    filename: '/base/src/app.tsx',
    generatorOpts: {
      sourceFileName: '../src/app.tsx',
    },
    plugins: [
      ...(bake
        ? [[compiledBabelPlugin, { importReact: runtime === 'classic', optimizeCss: false }]]
        : []),
      ...(extract
        ? [
            [
              stripRuntimeBabelPlugin,
              { styleSheetPath, compiledRequireExclude, extractStylesToDirectory },
            ],
          ]
        : []),
    ],
    presets: [
      [
        '@babel/preset-react',
        {
          runtime,
          ...(opts.babelJSXPragma ? { pragma: opts.babelJSXPragma } : {}),
          ...(opts.babelJSXImportSource ? { importSource: opts.babelJSXImportSource } : {}),
        },
      ],
    ],
  });
};

export const transform = (c: string, opts: TransformOptions): string => {
  const fileResult = transformSync(c, opts);

  if (!fileResult || !fileResult.code) {
    throw new Error(`Missing fileResult: ${fileResult}`);
  }

  return format(fileResult.code, {
    parser: 'babel',
    singleQuote: true,
  });
};
