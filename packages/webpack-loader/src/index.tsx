import path from 'path';
import { transformAsync } from '@compiled/babel-plugin';
import { getOptions } from 'loader-utils';

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
    const options =
      typeof this.getOptions === 'undefined'
        ? // Webpack v4 flow
          getOptions(this)
        : // Webpack v5 flow
          this.getOptions({
            type: 'object',
            properties: {
              importReact: {
                type: 'boolean',
              },
              nonce: {
                type: 'string',
              },
            },
          });

    const result = await transformAsync(code, {
      filename: this.resourcePath,
      opts: { ...options, cache: true },
    });

    result.includedFiles.forEach((file) => {
      this.addDependency(path.normalize(file));
    });

    callback(null, result.code);
  } catch (e) {
    callback(e);
  }
}
