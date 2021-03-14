import { Compilation, sources, NormalModule } from 'webpack';
import type { Compiler } from 'webpack';
import { sort } from '@compiled/css';

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
 * CompiledExtractPlugin
 *
 * This webpack plugin should be paired with `@compiled/webpack-loader` when `extract` is `true`.
 * It hoists unstable atomic styles to the parent CSS chunk and then sorts the style sheet.
 */
export class CompiledExtractPlugin {
  apply(compiler: Compiler): void {
    forceCSSIntoOneStyleSheet(compiler);

    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      NormalModule.getCompilationHooks(compilation).loader.tap(pluginName, (loaderContext) => {
        // We add some information here to tell loaders that the plugin has been configured.
        // The bundle will throw if this is missing (i.e. consumers did not setup correctly).
        // @ts-ignore
        loaderContext[pluginName] = true;
      });

      compilation.hooks.processAssets.tapPromise(
        {
          name: pluginName,
          stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
        },
        async (assets) => {
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
