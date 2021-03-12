import { Compilation, ModuleFilenameHelpers } from 'webpack';
import type { Compiler } from 'webpack';

const pluginName = 'CompiledExtractPlugin';

const getCSSAssets = (options: any, assets: Compilation['assets']) => {
  return Object.keys(assets)
    .filter((assetName) => {
      return ModuleFilenameHelpers.matchObject(options, assetName);
    })
    .map((assetName) => ({ name: assetName, source: assets[assetName], info: {} }));
};

/**
 * CompiledExtractPlugin
 *
 * This webpack plugin should be paired with `@compiled/webpack-loader` when `extract` is `true`.
 * It hoists unstable atomic styles to the parent CSS chunk and then sorts the style sheet.
 */
export class CompiledExtractPlugin {
  options: any;

  constructor() {
    this.options = {
      test: /.css$/i,
    };
  }

  apply(compiler: Compiler): void {
    compiler.hooks.compilation.tap(pluginName, (compilation: Compilation) => {
      compilation.hooks.processAssets.tapPromise(
        {
          name: pluginName,
          stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_COUNT,
        },
        async (assets) => {
          const cssAssets = getCSSAssets(this.options, assets);
          if (cssAssets.length === 0) {
            return;
          }

          console.log('Hiosting CSS');
        }
      );

      compilation.hooks.processAssets.tapPromise(
        {
          name: pluginName,
          stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
        },
        async (assets) => {
          const cssAssets = getCSSAssets(this.options, assets);
          if (cssAssets.length === 0) {
            return;
          }

          console.log('Sorting CSS');
        }
      );
    });
  }
}
