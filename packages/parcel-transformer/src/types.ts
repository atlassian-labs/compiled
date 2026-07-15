import type { PluginItem } from '@babel/core';
import type { PluginOptions } from '@compiled/babel-plugin';
import type { ResolveOptions } from 'enhanced-resolve';

type BabelPluginOpts = Omit<PluginOptions, 'cache' | 'onIncludedFiles' | 'resolver'>;

export interface ParcelTransformerOpts extends BabelPluginOpts {
  extract?: boolean;
  extractFromDistributedCode?: boolean;
  stylesheetPath?: string;

  /**
   * List of transformer babel plugins to be applied to evaluated files
   *
   * See the [babel docs](https://babeljs.io/docs/en/plugins/#transform-plugins)
   */
  transformerBabelPlugins?: PluginItem[];

  /**
   * Builds in a node environment.
   * Defaults to `false`.
   */
  ssr?: boolean;

  /**
   * Will run additional cssnano plugins to normalize CSS during build.
   *
   * Default to `true`.
   */
  optimizeCss?: boolean;

  /**
   * @deprecated Override the default `resolve` used by @compiled/babel-plugin, which is used to statically evaluate import declarations
   */
  resolve?: ResolveOptions;

  /**
   * Override the default @compiled/babel-plugin resolver, by providing a module path that exports a custom resolver
   */
  resolver?: string;

  /**
   * Add the component name as class name to DOM in non-production environment if styled is used
   *
   * Default to `false`
   */
  addComponentName?: boolean;

  /**
   * When set, extract styles to an external CSS file
   */
  extractStylesToDirectory?: { source: string; dest: string };

  /**
   * Adds a defined prefix to the generated classes' hashes.
   * Useful in micro frontend environments to avoid clashing/specificity issues.
   *
   * This will throw an error if used alongside extraction or `extract: true`.
   */
  classHashPrefix?: string;
}
