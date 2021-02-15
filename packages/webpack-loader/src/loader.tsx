import path from 'path';
import { transformAsync } from '@compiled/babel-plugin';
import type { LoaderOptions } from './types';

/**
 * Compiled webpack loader.
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
    const { sheetStore, ...options }: LoaderOptions = this.getOptions({
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

    if (options.extract && !sheetStore) {
      throw new Error('Plugin not setup.');
    }

    const result = await transformAsync(code, {
      filename: this.resourcePath,
      opts: { ...options, cache: true },
    });

    result.includedFiles.forEach((file) => {
      this.addDependency(path.normalize(file));
    });

    if (options.extract && sheetStore) {
      sheetStore.add(result.sheets);
    }

    callback(null, result.code);
  } catch (e) {
    callback(e);
  }
}
