import { transformSync } from '@babel/core';
import { format } from 'prettier';

import babelPlugin from './babel-plugin';
import type { PluginOptions } from './types';

export type TransformOptions = PluginOptions & {
  filename?: string;
  pretty?: boolean;
};

export const transform = (code: string, options: TransformOptions = {}): string => {
  const { filename, pretty = true, ...pluginOptions } = options;
  const fileResult = transformSync(code, {
    babelrc: false,
    comments: false,
    compact: !pretty,
    configFile: false,
    filename,
    plugins: [[babelPlugin, pluginOptions]],
  });

  if (!fileResult || !fileResult.code) {
    return '';
  }

  const { code: babelCode } = fileResult;
  if (!pretty) {
    return babelCode;
  }

  const ifIndex = babelCode.indexOf('if (process.env.NODE_ENV');
  // Remove the imports from the code, and the styled components display name
  const snippet = babelCode
    .substring(babelCode.indexOf('const'), ifIndex === -1 ? babelCode.length : ifIndex)
    .trim();

  return format(snippet, {
    parser: 'babel',
  });
};
