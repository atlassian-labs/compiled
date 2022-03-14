import type { PluginOptions } from '@compiled/babel-plugin';

type BabelPluginOpts = Omit<PluginOptions, 'cache' | 'onIncludedFiles'>;

export interface ParcelTransformerOpts extends BabelPluginOpts {
  extract?: boolean;
  stylesheetPath?: string;
}
