import { transformSync } from '@babel/core';
import { DEFAULT_PARSER_BABEL_PLUGINS } from '@compiled/utils';
import { format } from 'prettier';

import babelPlugin from './babel-plugin';
import type { PluginOptions } from './types';

export type TransformOptions = PluginOptions & {
  comments?: boolean;
  highlightCode?: boolean;
  filename?: string;
  pretty?: boolean;
  snippet?: boolean;
};

export const transform = (code: string, options: TransformOptions = {}): string => {
  const {
    comments = false,
    filename,
    highlightCode,
    pretty = true,
    snippet,
    optimizeCss = false,
    ...pluginOptions
  } = options;
  const fileResult = transformSync(code, {
    babelrc: false,
    comments,
    compact: !pretty,
    configFile: false,
    filename,
    highlightCode,
    plugins: [[babelPlugin, { optimizeCss, ...pluginOptions }]],
    presets:
      pluginOptions.importReact === false
        ? [['@babel/preset-react', { runtime: 'automatic' }]]
        : [],
    parserOpts: {
      plugins: pluginOptions.parserBabelPlugins ?? DEFAULT_PARSER_BABEL_PLUGINS,
    },
  });

  if (!fileResult || !fileResult.code) {
    return '';
  }

  const { code: babelCode } = fileResult;
  let codeSnippet;

  if (snippet) {
    const ifIndex = babelCode.indexOf('if (process.env.NODE_ENV');
    // Remove the imports from the code, and the styled components display name
    codeSnippet = babelCode
      .substring(babelCode.indexOf('const'), ifIndex === -1 ? babelCode.length : ifIndex)
      .trim();
  } else {
    codeSnippet = babelCode;
  }

  return pretty ? format(codeSnippet, { parser: 'babel-ts' }) : codeSnippet;
};
