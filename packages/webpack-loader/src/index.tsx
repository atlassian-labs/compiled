import path from 'path';
import { transformFromAstAsync, parseAsync } from '@babel/core';
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
    const includedFiles: string[] = [];
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

    // Transform to an AST using the local babel config.
    const ast = await parseAsync(code, {
      filename: this.resourcePath,
      caller: { name: 'compiled' },
    });

    // Transform using the Compiled Babel Plugin - we deliberately turn off using the local config.
    const result = await transformFromAstAsync(ast!, code, {
      babelrc: false,
      configFile: false,
      sourceMaps: true,
      filename: this.resourcePath,
      plugins: [
        [
          '@compiled/babel-plugin',
          { ...options, onIncludedFiles: (files: string[]) => includedFiles.push(...files) },
        ],
      ],
    });

    includedFiles.forEach((file) => {
      this.addDependency(path.normalize(file));
    });

    callback(null, result?.code, result?.map ?? undefined);
  } catch (e) {
    callback(e);
  }
}
