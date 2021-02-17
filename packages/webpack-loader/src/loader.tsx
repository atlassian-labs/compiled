import path from 'path';
import { transformAsync } from '@compiled/babel-plugin';
import { createSetupError } from './utils/create-error';
import type { LoaderOptions } from './types';

/**
 * Compiled webpack loader.
 *
 * When used by itself it improves the local developer experience when imports used in your
 * CSS have been inlined.
 *
 * Also enables CSS extraction when the `extract` option is set to `true`.
 *
 * @param this
 * @param code
 */
export default async function compiledLoader(this: any, code: string): Promise<void> {
  const callback = this.async();

  // Bail early if Compiled isn't in the module.
  if (code.indexOf('@compiled/react') === -1) {
    return callback(null, code);
  }

  try {
    const { __sheetStore, ...options }: LoaderOptions = this.getOptions({
      type: 'object',
      properties: {
        extract: {
          type: 'boolean',
        },
        importReact: {
          type: 'boolean',
        },
        nonce: {
          type: 'string',
        },
      },
    });

    if (options.extract && !__sheetStore) {
      throw createSetupError(`The CompiledExtractPlugin has not been configured, import the plugin and add it to the plugins array in your webpack config.

  const { CompiledExtractPlugin } = require('@compiled/webpack-loader');

  plugins: [
    new HtmlWebpackPlugin(),
    new CompiledExtractPlugin(),
  ]`);
    }

    const result = await transformAsync(code, {
      filename: this.resourcePath,
      opts: { ...options, cache: true },
    });

    result.includedFiles.forEach((file) => {
      // Webpack needs to be told of any files that have been inlined into userland CSS
      // so that things get rebuilt without needing to modify the owning file.
      // Without it - you'd need to modify that file before your changes are reflected!
      this.addDependency(path.normalize(file));
    });

    if (options.extract && __sheetStore) {
      __sheetStore.add(result.sheets);
    }

    callback(null, result.code);
  } catch (e) {
    callback(e);
  }
}
