import { transformAsync } from '@babel/core';
import babelPlugin from './babel-plugin';
import type { TransformResult, PluginOptions } from './types';

/**
 * Transforms code into Compiled components.
 *
 * @param code Code to transform
 * @param opts Userland options
 */
export async function transform(code: string, opts: PluginOptions = {}): Promise<TransformResult> {
  const includedFiles: string[] = [];
  const result = await transformAsync(code, {
    babelrc: false,
    configFile: false,
    plugins: [
      [babelPlugin, { ...opts, onIncludedFile: (file: string) => includedFiles.push(file) }],
    ],
  });

  return {
    code: result?.code,
    includedFiles,
  };
}
