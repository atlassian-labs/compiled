import { Compilation, sources } from 'webpack';
// import safeRequire from 'safe-require';
import { createStore } from './sheet-store';
import type { SheetStore } from './types';

// const HtmlWebpackPlugin = safeRequire('html-webpack-plugin');

const findCompiledLoaders = (rules: any) => {
  const loaders: any[] = [];

  rules.forEach((rule: any) => {
    if (Array.isArray(rule.use)) {
      rule.use.forEach((use: any) => {
        if (use.loader === '@compiled/webpack-loader') {
          loaders.push(use);
        }
      });
    } else if (typeof rule.use === 'object') {
      if (rule.use.loader === '@compiled/webpack-loader') {
        loaders.push(rule.use);
      }
    }
  });

  return loaders;
};

const injectStore = (loader: any, sheetStore: any) => {
  if (!loader.options) {
    loader.options = {};
  }

  loader.options.sheetStore = sheetStore;
};

export class CompiledExtractPlugin {
  sheetStore: SheetStore;

  constructor() {
    this.sheetStore = createStore();
  }

  apply(compiler: any): void {
    const loaders = findCompiledLoaders(compiler.options.module.rules);
    if (loaders.length === 0) {
      throw new Error('@compiled/webpack-loader not setup');
    }

    loaders.forEach((loader) => injectStore(loader, this.sheetStore));

    compiler.hooks.compilation.tap('CompiledExtractPlugin', (compilation: any) => {
      // console.log(HtmlWebpackPlugin);

      // HtmlWebpackPlugin.getHooks(compilation).alterAssetTags.tap(
      //   'CompiledExtractPlugin',
      //   (data: any) => {
      //     console.log('hello??????');

      //     return data;
      //   }
      // );

      compilation.hooks.processAssets.tap(
        {
          name: 'CompiledExtractPlugin',
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        () => {
          const stylesheet = this.sheetStore.get().join('');
          if (!stylesheet) {
            return;
          }

          const name = 'atomic.css';

          if (compilation.getAsset(name)) {
            compilation.updateAsset(name, new sources.OriginalSource(stylesheet, name));
          } else {
            compilation.emitAsset(name, new sources.OriginalSource(stylesheet, name));
          }
        }
      );
    });
  }
}
