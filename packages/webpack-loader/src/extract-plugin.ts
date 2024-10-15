import { sort } from '@compiled/css';
import { createError, toBoolean } from '@compiled/utils';
import type { Compilation, Compiler } from 'webpack';

import type { CompiledExtractPluginOptions } from './types';
import {
  getAssetSourceContents,
  getOptimizeAssetsHook,
  getSources,
  setPluginConfiguredOption,
} from './utils';

export const pluginName = 'CompiledExtractPlugin';
export const styleSheetName = 'compiled-css';

/**
 * Returns CSS Assets that we're interested in.
 *
 * @param options
 * @param assets
 * @returns
 */
const getCSSAssets = (assets: Compilation['assets']) => {
  return Object.keys(assets)
    .filter((assetName) => {
      return assetName.includes(styleSheetName) && assetName.endsWith('.css');
    })
    .map((assetName) => ({ name: assetName, source: assets[assetName], info: {} }));
};

/**
 * Set a cache group to force all CompiledCSS found to be in a single style sheet.
 * We do this to simplify the sorting story for now. Later on we can investigate
 * hoisting only unstable styles into the parent style sheet from async chunks.
 *
 * @param compiler
 */
const forceCSSIntoOneStyleSheet = (compiler: Compiler, options: CompiledExtractPluginOptions) => {
  const cacheGroup = {
    compiledCSS: {
      name: styleSheetName,
      type: 'css/mini-extract',
      chunks: 'all',
      // We merge only CSS from Compiled.
      test: /(css-loader\/compiled-css|\.compiled)\.css$/,
      enforce: true,
      priority: Infinity,
    },
  };

  if (!compiler.options.optimization) {
    compiler.options.optimization = {};
  }

  if (!compiler.options.optimization.splitChunks) {
    compiler.options.optimization.splitChunks = {
      cacheGroups: {},
    };
  }

  if (!compiler.options.optimization.splitChunks.cacheGroups) {
    compiler.options.optimization.splitChunks.cacheGroups = {};
  }

  Object.assign(
    compiler.options.optimization.splitChunks.cacheGroups,
    options.cacheGroupExclude ? {} : cacheGroup
  );
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
        [pluginName]: true,
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

    // @ts-expect-error -- Make sure this config doesn't bleed in as it's passed through
    if (options.classHashPrefix) {
      throw new Error(
        '`@compiled/webpack-loader.CompiledExtractPlugin` is mixing the `extract: true` and `classHashPrefix` options, which is not supported and will result in bundle size bloat.'
      );
    }
  }

  apply(compiler: Compiler): void {
    const { RawSource } = getSources(compiler);

    pushNodeModulesExtractLoader(compiler, this.#options);
    forceCSSIntoOneStyleSheet(compiler, this.#options);

    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      setPluginConfiguredOption(compilation.options.module.rules, pluginName);

      getOptimizeAssetsHook(compiler, compilation).tap(pluginName, (assets) => {
        const cssAssets = getCSSAssets(assets);
        if (cssAssets.length === 0) {
          return;
        }

        const [asset] = cssAssets;
        const contents = getAssetSourceContents(asset.source);

        const sortConfig = {
          sortAtRulesEnabled: this.#options.sortAtRules,
          sortShorthandEnabled: this.#options.sortShorthand,
        };
        const newSource = new RawSource(sort(contents, sortConfig));

        compilation.updateAsset(asset.name, newSource, asset.info);
      });
    });
  }
}
