import { transformFromAstAsync, parseAsync } from '@babel/core';
import { unique } from '@compiled/utils';
import babelPlugin from './babel-plugin';
import type { TransformResult, PluginOptions } from './types';

interface TransformOpts {
  filename: string;
  opts?: Omit<PluginOptions, 'onIncludedFile'> & { extract?: boolean };
}

/**
 * Transforms code into Compiled components.
 *
 * @param code Code to transform
 * @param opts Userland options
 */
export async function transformAsync(code: string, opts: TransformOpts): Promise<TransformResult> {
  const includedFiles: string[] = [];
  const sheets: string[] = [];

  // Transform to an AST using the local babel config.
  const ast = await parseAsync(code, {
    filename: opts.filename,
    caller: { name: 'compiled' },
  });

  // Transform using the Compiled Babel Plugin - we deliberately turn off using the local config.
  const result = await transformFromAstAsync(ast!, code, {
    babelrc: false,
    configFile: false,
    filename: opts.filename,
    plugins: [
      [babelPlugin, { ...opts.opts, onIncludedFile: (file: string) => includedFiles.push(file) }],
      [
        '@compiled/babel-plugin-extract',
        {
          onFoundStyleSheet: (sheet: string) => sheets.push(sheet),
        },
      ],
    ],
  });

  return {
    code: result?.code,
    includedFiles: unique(includedFiles),
    sheets,
  };
}
