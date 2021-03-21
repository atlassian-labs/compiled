import { sort } from '@compiled/css';
import { toBoolean } from '@compiled/utils';
import type { Compiler, Compilation, sources } from 'webpack';
import type { CompiledExtractPluginOptions } from './types';

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
      return assetName.startsWith(styleSheetName);
    })
    .map((assetName) => ({ name: assetName, source: assets[assetName], info: {} }));
};

/**
 * Returns the string representation of an assets source.
 *
 * @param source
 * @returns
 */
const getAssetSourceContents = (assetSource: sources.Source) => {
  const source = assetSource.source();
  if (typeof source === 'string') {
    return source;
  }

  return source.toString();
};

/**
 * Set a cache group to force all CompiledCSS found to be in a single style sheet.
 * We do this to simplify the sorting story for now. Later on we can investigate
 * hoisting only unstable styles into the parent style sheet from async chunks.
 *
 * @param compiler
 */
const forceCSSIntoOneStyleSheet = (compiler: Compiler) => {
  const cacheGroup = {
    compiledCSS: {
      name: styleSheetName,
      type: 'css/mini-extract',
      chunks: 'all',
      // We merge only CSS from Compiled.
      test: /css-loader\/extract\.css$/,
      enforce: true,
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

  Object.assign(compiler.options.optimization.splitChunks.cacheGroups, cacheGroup);
};

/**
 * Pushes a new loader onto the compiler.
 * The loader will be applied to all JS files found in node modules that import `@compiled/react`.
 *
 * @param compiler
 */
const applyExtractFromNodeModule = (
  compiler: Compiler,
  options: CompiledExtractPluginOptions
): void => {
  if (!compiler.options.module) {
    throw new Error();
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
    const { NormalModule, Compilation, version, sources: wp5sources } =
      // Webpack 5 flow
      compiler.webpack ||
      // Override flow
      this.#options.webpack ||
      // Webpack 4 flow
      require('webpack');

    const sources = wp5sources || require('webpack-sources');
    const isWebpack4 = version.startsWith('4.');

    applyExtractFromNodeModule(compiler, this.#options);
    forceCSSIntoOneStyleSheet(compiler);

    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      const normalModuleHook =
        NormalModule && typeof NormalModule.getCompilationHooks !== 'undefined'
          ? // Webpack 5 flow
            NormalModule.getCompilationHooks(compilation).loader
          : // Webpack 4 flow
            compilation.hooks.normalModuleLoader;

      normalModuleHook.tap(pluginName, (loaderContext) => {
        // We add some information here to tell loaders that the plugin has been configured.
        // Bundling will throw if this is missing (i.e. consumers did not setup correctly).
        (loaderContext as any)[pluginName] = true;
      });

      const optimizeAssets =
        // Webpack 5 flow
        compilation.hooks.processAssets ||
        // Webpack 4 flow
        compilation.hooks.optimizeAssets;

      optimizeAssets.tap(
        isWebpack4
          ? pluginName
          : {
              name: pluginName,
              stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
            },
        (assets) => {
          const cssAssets = getCSSAssets(assets);
          if (cssAssets.length === 0) {
            return;
          }

          const [asset] = cssAssets;
          const contents = getAssetSourceContents(asset.source);
          const newSource = new sources.RawSource(sort(contents));

          compilation.updateAsset(asset.name, newSource, asset.info);
        }
      );
    });
  }
}
