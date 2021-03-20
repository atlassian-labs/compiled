import path from 'path';
import { transformFromAstAsync, parseAsync } from '@babel/core';
import { getOptions } from 'loader-utils';
import { toBoolean, createError } from '@compiled/utils';
import type { CompiledLoaderOptions, LoaderThis } from './types';
import { pluginName } from './extract-plugin';

/**
 * Returns user configuration.
 *
 * @param loader
 * @returns
 */
function getLoaderOptions(context: LoaderThis<CompiledLoaderOptions>) {
  const {
    bake = true,
    extract = false,
    importReact = false,
    nonce = undefined,
  }: CompiledLoaderOptions =
    typeof context.getOptions === 'undefined'
      ? // Webpack v4 flow
        getOptions(context)
      : // Webpack v5 flow
        context.getOptions({
          type: 'object',
          properties: {
            importReact: {
              type: 'boolean',
            },
            nonce: {
              type: 'string',
            },
            extract: {
              type: 'boolean',
            },
            bake: {
              type: 'boolean',
            },
          },
        });

  return { bake, extract, importReact, nonce };
}

/**
 * Compiled webpack loader.
 *
 * @param this
 * @param code
 */
export default async function compiledLoader(
  this: LoaderThis<CompiledLoaderOptions>,
  code: string
): Promise<void> {
  const callback = this.async();

  // Bail early if Compiled isn't in the module.
  if (code.indexOf('@compiled/react') === -1) {
    return callback(null, code);
  }

  try {
    const includedFiles: string[] = [];
    const foundCSSRules: string[] = [];
    const options = getLoaderOptions(this);

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
        options.extract && [
          '@compiled/babel-plugin-strip-runtime',
          { onFoundStyleRules: (rules: string[]) => foundCSSRules.push(...rules) },
        ],
        options.bake && [
          '@compiled/babel-plugin',
          { ...options, onIncludedFiles: (files: string[]) => includedFiles.push(...files) },
        ],
      ].filter(toBoolean),
    });

    includedFiles.forEach((file) => {
      this.addDependency(path.normalize(file));
    });

    let output: string = result?.code || '';

    if (options.extract && foundCSSRules.length) {
      foundCSSRules.forEach((rule) => {
        // Each found atomic rule will create a new import that uses `@compiled/webpack-loader/css-loader`.
        // The benefit is two fold:
        // (1) thread safe collection of styles
        // (2) caching -- resulting in faster builds (one import per rule!)
        const params = encodeURIComponent(rule);

        // We use require instead of import so it works with both ESM and CJS source.
        // If we used ESM it would blow up with CJS source, unfortunately.
        output = `
  require("@compiled/webpack-loader/css-loader!@compiled/webpack-loader/css-loader/extract.css?style=${params}");
  ${output}`;
      });
    }

    callback(null, output, result?.map ?? undefined);
  } catch (e) {
    callback(e);
  }
}

export function pitch(this: LoaderThis<CompiledLoaderOptions>): void {
  const options = getLoaderOptions(this);

  if (options.extract && !this[pluginName]) {
    throw createError('webpack-loader')(
      `You forgot to add the 'CompiledExtractPlugin' plugin (i.e \`{ plugins: [new CompiledExtractPlugin()] }\`), please read https://compiledcssinjs.com/docs/webpack-extract`
    );
  }
}
