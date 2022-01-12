import type { ParserPlugin } from '@babel/parser';
import type { ResolveOptions, RuleSetCondition } from 'webpack';

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
   * List of babel plugins to be applied to evaluated files
   */
  babelPlugins?: ParserPlugin[];
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
}
