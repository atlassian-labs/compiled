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
   * Set to true if CompiledExtractPlugin has been set up correctly.
   */
  [pluginName]?: boolean;

  /**
   * Build in a node environment.
   * Defaults to `false`.
   */
  ssr?: boolean;

  /**
   * Add the component name as class name to DOM in non-production environment if styled is used.
   *
   * Defaults to `false`.
   */
  addComponentName?: boolean;

  /**
   * A map holds the key-value pairs between full Atomic class names and the compressed ones,
   * i.e. { '_aaaabbbb': 'a' }.
   *
   * Default to `undefined`
   */
  classNameCompressionMap?: object;

  /**
   * When set, extract styles to an external CSS file.
   */
  extractStylesToDirectory?: { source: string; dest: string };

  /**
   * Custom resolver for babel plugin, when set overrides default resolver.
   */
  resolver?: string;

  /**
   * Custom module origins that Compiled should compile when using APIs from.
   *
   * Passed to @compiled/babel-plugin.
   */
  importSources?: string[];

  /**
   * Adds a defined prefix to the generated classes' hashes.
   * Useful in micro frontend environments to avoid clashing/specificity issues.
   *
   * Avoid mixing this with extraction as this may throw an error if combined with extraction
   * or `extract: true` in Webpack loaders or Parcel tranformers.
   */
  classHashPrefix?: string;

  /**
   * EXPERIMENTAL: Use SWC instead of Babel for transformation.
   * - true: always use SWC
   * - false | undefined: use Babel
   * - 'auto': try SWC, fall back to Babel on error
   */
  swc?: boolean | 'auto';
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

  /**
   * Whether to sort at-rules, including media queries.
   * Defaults to `true`.
   */
  sortAtRules?: boolean;

  /**
   * Whether to sort shorthand and longhand properties,
   * eg. `margin` before `margin-top` for enforced determinism.
   * Defaults to `true`.
   */
  sortShorthand?: boolean;
}
