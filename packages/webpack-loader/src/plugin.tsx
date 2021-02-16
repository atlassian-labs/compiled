import { sources } from 'webpack';
import { createStore } from './sheet-store';
import type { SheetStore } from './types';

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
      compilation.hooks.renderManifest.tap(
        'CompiledExtractPlugin',
        (result: any, { chunk }: any) => {
          const stylesheet = this.sheetStore.get().join('');
          if (!stylesheet) {
            return;
          }

          const name = 'atomic.css';

          result.push({
            render: () => new sources.OriginalSource(stylesheet, name),
            filenameTemplate: name,
            pathOptions: {
              chunk,
              contentHashType: 'css/compiled',
            },
            identifier: `CompiledExtractPlugin.${chunk.id}`,
          });
        }
      );
    });
  }
}
