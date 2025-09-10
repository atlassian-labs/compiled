import { normalize } from 'path';

import { parseAsync, transformFromAstAsync } from '@babel/core';
import {
  createError,
  DEFAULT_IMPORT_SOURCES,
  DEFAULT_PARSER_BABEL_PLUGINS,
  toBoolean,
} from '@compiled/utils';
import { transformSync } from '@swc/core';
import { getOptions } from 'loader-utils';
import type { LoaderContext } from 'webpack';

import { createDefaultResolver } from './create-default-resolver';
import { pluginName, styleSheetName } from './extract-plugin';
import type { CompiledLoaderOptions } from './types';

let hasErrored = false;

/**
 * Returns user configuration.
 *
 * @param context
 * @returns
 */
function getLoaderOptions(context: LoaderContext<CompiledLoaderOptions>) {
  const {
    bake = true,
    extract = false,
    importReact = undefined,
    nonce = undefined,
    resolve = {},
    extensions = undefined,
    parserBabelPlugins = DEFAULT_PARSER_BABEL_PLUGINS,
    transformerBabelPlugins = [],
    swc = false,
    [pluginName]: isPluginEnabled = false,
    ssr = false,
    optimizeCss = true,
    addComponentName = false,
    classNameCompressionMap = undefined,
    extractStylesToDirectory = undefined,
    resolver = undefined,
    importSources = undefined,
    classHashPrefix = undefined,
  }: CompiledLoaderOptions = typeof context.getOptions === 'undefined'
    ? // Webpack v4 flow
      getOptions(context)
    : // Webpack v5 flow
      context.getOptions({
        type: 'object',
        properties: {
          bake: {
            type: 'boolean',
          },
          swc: { anyOf: [{ type: 'boolean' }, { enum: ['auto'] }] },
          extract: {
            type: 'boolean',
          },
          importReact: {
            type: 'boolean',
          },
          nonce: {
            type: 'string',
          },
          resolve: {
            type: 'object',
          },
          extensions: {
            type: 'array',
          },
          parserBabelPlugins: {
            type: 'array',
          },
          transformerBabelPlugins: {
            type: 'array',
          },
          [pluginName]: {
            type: 'boolean',
          },
          ssr: {
            type: 'boolean',
          },
          optimizeCss: {
            type: 'boolean',
          },
          addComponentName: {
            type: 'boolean',
          },
          classNameCompressionMap: {
            type: 'object',
          },
          extractStylesToDirectory: {
            type: 'object',
          },
          resolver: {
            type: 'string',
          },
          importSources: {
            type: 'array',
          },
          classHashPrefix: {
            type: 'string',
          },
        },
      });

  return {
    bake,
    extract,
    importReact,
    nonce,
    resolve,
    extensions,
    parserBabelPlugins,
    transformerBabelPlugins,
    swc,
    [pluginName]: isPluginEnabled,
    ssr,
    optimizeCss,
    addComponentName,
    classNameCompressionMap,
    extractStylesToDirectory,
    resolver,
    importSources,
    classHashPrefix,
  };
}

/**
 * Compiled webpack loader.
 *
 * @param this
 * @param code
 */
export default async function compiledLoader(
  this: LoaderContext<CompiledLoaderOptions>,
  code: string
): Promise<void> {
  const callback = this.async();
  const { resolve, ...options } = getLoaderOptions(this);
  const importSources = [...DEFAULT_IMPORT_SOURCES, ...(options.importSources || [])];

  // Bail early if we're looking at Compiled runtime code or Compiled (via an importSource) isn't in the module
  if (
    this.resourcePath.includes('/node_modules/@compiled/react') ||
    !importSources.some((name) => code.includes(name))
  ) {
    return callback(null, code);
  }

  try {
    const includedFiles: string[] = [];

    const swcMode = options.swc;
    const shouldTrySwc = swcMode === true || swcMode === 'auto';

    if (!shouldTrySwc) {
      const ast = await parseAsync(code, {
        filename: this.resourcePath,
        babelrc: false,
        configFile: false,
        caller: { name: 'compiled' },
        rootMode: 'upward-optional',
        parserOpts: {
          plugins: options.parserBabelPlugins,
        },
        plugins: options.transformerBabelPlugins ?? undefined,
      });

      const result = await transformFromAstAsync(ast!, code, {
        babelrc: false,
        configFile: false,
        sourceMaps: true,
        filename: this.resourcePath,
        parserOpts: {
          plugins: options.parserBabelPlugins,
        },
        plugins: [
          ...(options.transformerBabelPlugins ?? []),
          options.extract && [
            '@compiled/babel-plugin-strip-runtime',
            {
              styleSheetPath: `@compiled/webpack-loader/css-loader!@compiled/webpack-loader/css-loader/${styleSheetName}.css`,
              compiledRequireExclude: options.ssr,
              extractStylesToDirectory: options.extractStylesToDirectory,
            },
          ],
          options.bake && [
            '@compiled/babel-plugin',
            {
              ...options,
              classNameCompressionMap: options.extract && options.classNameCompressionMap,
              onIncludedFiles: (files: string[]) => includedFiles.push(...files),
              resolver: options.resolver
                ? options.resolver
                : createDefaultResolver({
                    resolveOptions: resolve,
                    webpackResolveOptions: this._compilation?.options.resolve,
                  }),
            },
          ],
        ].filter(toBoolean),
      });

      includedFiles.forEach((file) => {
        this.addDependency(normalize(file));
      });

      return callback(null, result?.code || '', result?.map ?? undefined);
    }

    // SWC path
    if (shouldTrySwc) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const getSwcPlugin2: any = require('@compiled/swc-plugin').getSwcPlugin2;
        const extract = !!options.extract;
        const [wasmPath, pluginConfig] = getSwcPlugin2({
          importSources,
          development: process.env.NODE_ENV !== 'production',
          runtimeImport: '@compiled/react/runtime',
          extract,
          extractStylesToDirectory: options.extractStylesToDirectory,
          filename: this.resourcePath,
          sourceFileName: this.resourcePath,
        });

        const hasJsxPragma = /\/\*\*\s*@jsx\s+\w+\s*\*\//.test(code);
        const swcResult: any = transformSync(code, {
          filename: this.resourcePath,
          sourceMaps: true,
          cwd: process.cwd(),
          jsc: {
            target: 'esnext',
            externalHelpers: true,
            parser: {
              syntax:
                this.resourcePath.endsWith('.ts') || this.resourcePath.endsWith('.tsx')
                  ? 'typescript'
                  : 'ecmascript',
              tsx: this.resourcePath.endsWith('.tsx') || this.resourcePath.endsWith('.jsx'),
              jsx: this.resourcePath.endsWith('.jsx') || this.resourcePath.endsWith('.tsx'),
            } as any,
            transform: {
              react: {
                runtime: hasJsxPragma ? 'classic' : 'automatic',
                pragma: hasJsxPragma ? 'jsx' : undefined,
                pragmaFrag: hasJsxPragma ? 'Fragment' : undefined,
                development: process.env.NODE_ENV !== 'production',
                importSource: 'react',
              },
            },
            experimental: {
              plugins: [[wasmPath, pluginConfig]],
            },
          },
          module: { type: 'es6' },
        });

        // Inject style requires to mimic strip-runtime
        // Respect SSR flag (equivalent to compiledRequireExclude) by skipping require injection
        if (extract && !options.ssr && swcResult && typeof swcResult.code === 'string') {
          const styleRules: string[] = [];
          const ruleRegex = /const\s+_[0-9]*\s*=\s*"([\s\S]*?)";/g;
          let match: RegExpExecArray | null;
          while ((match = ruleRegex.exec(swcResult.code)) !== null) {
            const candidate = match[1];
            if (candidate.includes('{') && candidate.includes('}')) {
              styleRules.push(candidate);
            }
          }
          for (const rule of styleRules) {
            const params = encodeURIComponent(rule);
            swcResult.code = `${swcResult.code}\n;require("@compiled/webpack-loader/css-loader!@compiled/webpack-loader/css-loader/${styleSheetName}.css?style=${params}");`;
          }
        }

        const mapOut =
          swcResult && typeof swcResult.map === 'string'
            ? (JSON.parse(swcResult.map) as any)
            : swcResult?.map ?? undefined;
        return callback(null, swcResult?.code || '', mapOut);
      } catch (err) {
        if (swcMode === true) {
          throw err;
        }
        // fall through to Babel when swcMode === 'auto'
      }
    }

    // Babel fallback (or primary when swc is false/undefined)
    const ast = await parseAsync(code, {
      filename: this.resourcePath,
      babelrc: false,
      configFile: false,
      caller: { name: 'compiled' },
      rootMode: 'upward-optional',
      parserOpts: {
        plugins: options.parserBabelPlugins,
      },
      plugins: options.transformerBabelPlugins ?? undefined,
    });

    const result = await transformFromAstAsync(ast!, code, {
      babelrc: false,
      configFile: false,
      sourceMaps: true,
      filename: this.resourcePath,
      parserOpts: {
        plugins: options.parserBabelPlugins,
      },
      plugins: [
        ...(options.transformerBabelPlugins ?? []),
        options.extract && [
          '@compiled/babel-plugin-strip-runtime',
          {
            styleSheetPath: `@compiled/webpack-loader/css-loader!@compiled/webpack-loader/css-loader/${styleSheetName}.css`,
            compiledRequireExclude: options.ssr,
            extractStylesToDirectory: options.extractStylesToDirectory,
          },
        ],
        options.bake && [
          '@compiled/babel-plugin',
          {
            ...options,
            classNameCompressionMap: options.extract && options.classNameCompressionMap,
            onIncludedFiles: (files: string[]) => includedFiles.push(...files),
            resolver: options.resolver
              ? options.resolver
              : createDefaultResolver({
                  resolveOptions: resolve,
                  webpackResolveOptions: this._compilation?.options.resolve,
                }),
          },
        ],
      ].filter(toBoolean),
    });

    includedFiles.forEach((file) => {
      this.addDependency(normalize(file));
    });

    return callback(null, result?.code || '', result?.map ?? undefined);
  } catch (e: unknown) {
    // @ts-expect-error Not checking for error type
    const error = createError('compiled-loader', 'Unhandled exception')(e.stack);
    callback(error);
  }
}

export function pitch(this: LoaderContext<CompiledLoaderOptions>): void {
  const options = getLoaderOptions(this);
  if (!hasErrored && options.extract && !options[pluginName]) {
    this.emitError(
      createError('webpack-loader')(
        `You forgot to add the 'CompiledExtractPlugin' plugin (i.e \`{ plugins: [new CompiledExtractPlugin()] }\`), please read https://compiledcssinjs.com/docs/css-extraction-webpack`
      )
    );

    // We only want to error once, if we didn't do this you'd get an error for every file found.
    hasErrored = true;
  }
}
