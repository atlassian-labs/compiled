import type { PluginItem } from '@babel/core';
import type { PluginOptions } from '@compiled/babel-plugin';

type BabelPluginOpts = Omit<PluginOptions, 'cache' | 'onIncludedFiles'>;

export interface ParcelTransformerOpts extends BabelPluginOpts {
  extract?: boolean;
  stylesheetPath?: string;

  /**
   * List of transformer babel plugins to be applied to evaluated files
   *
   * See the [babel docs](https://babeljs.io/docs/en/plugins/#transform-plugins)
   */
  transformerBabelPlugins?: PluginItem[];
}
