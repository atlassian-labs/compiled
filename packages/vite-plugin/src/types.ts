import type { PluginItem } from '@babel/core';
import type { PluginOptions as BabelPluginOptions } from '@compiled/babel-plugin';

/**
 * Vite plugin options extending the babel-plugin options with Vite-specific configuration.
 */
export interface PluginOptions extends BabelPluginOptions {
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
   * List of transformer babel plugins to be applied to evaluated files
   *
   * See the [babel docs](https://babeljs.io/docs/en/plugins/#transform-plugins)
   */
  transformerBabelPlugins?: PluginItem[];

  /**
   * Build in a node environment.
   * Defaults to `false`.
   */
  ssr?: boolean;

  /**
   * When set, extract styles to an external CSS file.
   */
  extractStylesToDirectory?: { source: string; dest: string };

  /**
   * Whether to sort shorthand and longhand properties,
   * eg. `margin` before `margin-top` for enforced determinism.
   * Defaults to `true`.
   */
  sortShorthand?: boolean;
}
