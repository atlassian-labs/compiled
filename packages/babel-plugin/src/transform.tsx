import { transformFromAstAsync, parseAsync } from '@babel/core';
import { unique } from '@compiled/utils';
import babelPlugin from './babel-plugin';
import type { TransformResult, PluginOptions } from './types';

interface TransformOpts {
  filename: string;
  opts?: Omit<PluginOptions, 'onIncludedFile'>;
  postPlugins?: Array<string | [string, Record<string, any>]>;
}

/**
 * Transforms code into Compiled components.
 *
 * @param code Code to transform
 * @param opts Userland options
 */
export async function transformAsync(code: string, opts: TransformOpts): Promise<TransformResult> {
  const includedFiles: string[] = [];

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
      // The first plugin will convert user land usage into baked Compiled Components
      [babelPlugin, { ...opts.opts, onIncludedFile: (file: string) => includedFiles.push(file) }],

      // Pass through any other plugins that should run after the first plugin.
      ...(opts.postPlugins || []),
    ],
  });

  return {
    code: result?.code,
    includedFiles: unique(includedFiles),
  };
}
