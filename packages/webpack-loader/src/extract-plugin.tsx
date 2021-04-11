import { sort } from '@compiled/css';
import { toBoolean, createError } from '@compiled/utils';
import type { Compiler, Compilation } from 'webpack';
import type { CompiledExtractPluginOptions, LoaderOpts } from './types';
import {
  getAssetSourceContents,
  getNormalModuleHook,
  getOptimizeAssetsHook,
  getSources,
} from './utils/webpack';

export const pluginName = 'CompiledExtractPlugin';
export const styleSheetName = 'compiled-css';

/**
 * Returns CSS Assets from the current compilation.
 *
 * @param assets
 */
const getCSSAssets = (assets: Compilation['assets']) => {
  return Object.keys(assets)
    .filter((assetName) => {
      return assetName.endsWith('.css');
    })
    .map((assetName) => ({ name: assetName, source: assets[assetName], info: {} }));
};

/**
 * Pushes a new loader onto the compiler.
 * The loader will be applied to all JS files found in node modules that import `@compiled/react`.
 *
 * @param compiler
 */
const pushNodeModulesExtractLoader = (
  compiler: Compiler,
  options: CompiledExtractPluginOptions
): void => {
  if (!compiler.options.module) {
    throw createError('webpack-loader')('module options not defined');
  }

  compiler.options.module.rules.push({
    test: { and: [/node_modules.+\.js$/, options.nodeModulesTest].filter(toBoolean) },
    include: options.nodeModulesInclude,
    exclude: options.nodeModulesExclude,
    use: {
      loader: '@compiled/webpack-loader',
      options: {
        // We turn off baking as we're only interested in extracting from node modules (they're already baked)!
        bake: false,
        extract: true,
      },
    },
  });
};

/**
 * CompiledExtractPlugin
 *
 * This webpack plugin should be paired with `@compiled/webpack-loader` when `extract` is `true`.
 */
export class CompiledExtractPlugin {
  #options: CompiledExtractPluginOptions;

  constructor(options: CompiledExtractPluginOptions = {}) {
    this.#options = options;
  }

  apply(compiler: Compiler): void {
    const { RawSource } = getSources(compiler);

    pushNodeModulesExtractLoader(compiler, this.#options);

    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      getNormalModuleHook(compiler, compilation).tap(pluginName, (loaderContext: LoaderOpts) => {
        // We add some information here to tell loaders that the plugin has been configured.
        // Bundling will throw if this is missing (i.e. consumers did not setup correctly).
        loaderContext[pluginName] = true;
      });

      getOptimizeAssetsHook(compiler, compilation).tap(pluginName, (assets) => {
        const cssAssets = getCSSAssets(assets);
        if (cssAssets.length === 0) {
          return;
        }

        const [asset] = cssAssets;
        const contents = getAssetSourceContents(asset.source);
        const newSource = new RawSource(sort(contents));

        compilation.updateAsset(asset.name, newSource, asset.info);
      });
    });
  }
}
