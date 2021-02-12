import { transformAsync } from '@babel/core';
import { unique } from '@compiled/utils';
import babelPlugin from './babel-plugin';
import type { TransformResult, PluginOptions } from './types';

interface TransformOpts {
  opts?: Omit<PluginOptions, 'onIncludedFile'>;
  filename: string;
}

/**
 * Transforms code into Compiled components.
 *
 * @param code Code to transform
 * @param opts Userland options
 */
export async function transform(code: string, opts: TransformOpts): Promise<TransformResult> {
  const includedFiles: string[] = [];

  const result = await transformAsync(code, {
    babelrc: false,
    configFile: false,
    filename: opts.filename,
    plugins: [
      [babelPlugin, { ...opts.opts, onIncludedFile: (file: string) => includedFiles.push(file) }],
    ],
  });

  return {
    code: result?.code,
    includedFiles: unique(includedFiles),
  };
}
