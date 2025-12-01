import type { PluginItem } from '@babel/core';
import type { ParserPlugin } from '@babel/parser';

export interface CompiledVitePluginOptions {
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
   * Defaults to `true`.
   */
  optimizeCss?: boolean;

  /**
   * Enables CSP support,
   * read [Security](https://compiledcssinjs.com/docs/security) for more information.
   */
  nonce?: string;

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
   * Defaults to `undefined`
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
   * or `extract: true` in Webpack loaders or Parcel transformers.
   */
  classHashPrefix?: string;

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
