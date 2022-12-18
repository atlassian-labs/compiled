import type { PluginItem } from '@babel/core';
import type { ParserPlugin } from '@babel/parser';
import type { ResolveOptions, RuleSetCondition } from 'webpack';

import type { pluginName } from './extract-plugin';

export type { ResolveOptions };

export interface CompiledLoaderOptions {
  /**
   * Converts your source code into a Compiled component.
   * Defaults to `true`.
   */
  bake?: boolean;

  /**
   * Extracts to CSS when `true`.
   * Defaults to `false`.
   */
  extract?: boolean;

  /**
   * Will import React into the module if it is not found.
   * When using @babel/preset-react with the automatic runtime this is not needed and can be set to false.
   */
  importReact?: boolean;

  /**
   * Will run additional cssnano plugin to normalize CSS during build.
   * Default to `true`.
   */
  optimizeCss?: boolean;

  /**
   * Enables CSP support,
   * read [Security](https://compiledcssinjs.com/docs/security) for more information.
   */
  nonce?: string;

  /**
   * Override the default `resolve` passed into webpack, which is used to statically evaluate import declarations
   */
  resolve?: ResolveOptions;

  /**
   * List of file extensions to traverse as code
   */
  extensions?: string[];

  /**
   * List of transformer babel plugins to be applied to evaluated files
   *
   * See the [babel docs](https://babeljs.io/docs/en/plugins/#transform-plugins)
   */
  transformerBabelPlugins?: PluginItem[];

  /**
   * List of parse babel plugins to be applied to evaluated files
   *
   * See the [babel docs](https://babeljs.io/docs/en/plugins/#syntax-plugins)
   */
  parserBabelPlugins?: ParserPlugin[];

  /**
   * Set to true if CompiledExtractPlugin has been set up correctly
   */
  [pluginName]?: boolean;

  /**
   * Build in a node environment.
   * Defaults to `false`.
   */
  ssr?: boolean;

  /**
   * Add the component name as class name to DOM in non-production environment if styled is used
   *
   * Default to `false`
   */
  addComponentName?: boolean;
}

export interface CompiledExtractPluginOptions {
  /**
   * When set will include all matching conditions.
   * See: https://webpack.js.org/configuration/module/#condition
   */
  nodeModulesTest?: RuleSetCondition;

  /**
   * When set will include all conditions passed through.
   * See: https://webpack.js.org/configuration/module/#condition
   */
  nodeModulesInclude?: RuleSetCondition;

  /**
   * When set will exclude all conditions passed through.
   * See: https://webpack.js.org/configuration/module/#condition
   */
  nodeModulesExclude?: RuleSetCondition;

  /**
   * When set will prevent additional cacheGroup chunk to be created.
   * Eg. This may be required in SSR to prevent side-effects
   */
  cacheGroupExclude?: boolean;
}
