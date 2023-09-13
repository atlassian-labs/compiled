import fs from 'fs';
import { join, dirname, isAbsolute } from 'path';

import { parseAsync, transformFromAstAsync } from '@babel/core';
import generate from '@babel/generator';
import type { PluginOptions as BabelPluginOptions } from '@compiled/babel-plugin';
import type {
  PluginOptions as BabelStripRuntimePluginOptions,
  BabelFileMetadata,
} from '@compiled/babel-plugin-strip-runtime';
import { toBoolean } from '@compiled/utils';
import { Transformer } from '@parcel/plugin';
import SourceMap from '@parcel/source-map';
import { CachedInputFileSystem, ResolverFactory } from 'enhanced-resolve';

import type { ParcelTransformerOpts } from './types';

const configFiles = [
  '.compiledcssrc',
  '.compiledcssrc.json',
  'compiledcss.js',
  'compiledcss.config.js',
];

const packageKey = '@compiled/parcel-transformer';

/**
 * Compiled parcel transformer.
 */
export default new Transformer<ParcelTransformerOpts>({
  async loadConfig({ config, options }) {
    const conf = await config.getConfigFrom<ParcelTransformerOpts>(
      join(options.projectRoot, 'index'),
      configFiles,
      {
        packageKey,
      }
    );

    const contents: ParcelTransformerOpts = {
      extract: false,
      importReact: true,
      ssr: false,
    };

    if (conf) {
      if (conf.filePath.endsWith('.js')) {
        config.invalidateOnStartup();
      }

      // Use `classNameCompressionMapFilePath` to get classNameCompressionMap
      // Note `classNameCompressionMap` and `classNameCompressionMapFilePath` are mutually exclusive.
      // If both are provided, classNameCompressionMap takes precedence.
      if (!conf.contents.classNameCompressionMap && conf.contents.classNameCompressionMapFilePath) {
        // Use `getConfigFrom` from Parcel so the contents are cached at `.parcel-cache`
        const configClassNameCompressionMap = await config.getConfigFrom(
          join(options.projectRoot, 'index'),
          [conf.contents.classNameCompressionMapFilePath],
          {
            packageKey,
          }
        );

        if (configClassNameCompressionMap?.contents) {
          Object.assign(contents, {
            classNameCompressionMap: configClassNameCompressionMap?.contents,
          });
        }
      }

      Object.assign(contents, conf.contents);
    }

    return contents;
  },

  canReuseAST() {
    // Compiled should run before any other JS transformer.
    return false;
  },

  async parse({ asset, config, options }) {
    // Disable stylesheet extraction locally due to https://github.com/atlassian-labs/compiled/issues/1306
    const extract = config.extract && options.mode !== 'development';
    if (!asset.isSource && !extract) {
      // Only parse source (pre-built code should already have been baked) or if stylesheet extraction is enabled
      return undefined;
    }

    const code = await asset.getCode();
    if (code.indexOf('@compiled/react') === -1) {
      // We only want to parse files that are actually using Compiled.
      // For everything else we bail out.
      return undefined;
    }

    const program = await parseAsync(code, {
      filename: asset.filePath,
      caller: { name: 'compiled' },
      rootMode: 'upward-optional',
      parserOpts: {
        plugins: config.parserBabelPlugins ?? undefined,
      },
      plugins: config.transformerBabelPlugins ?? undefined,
    });

    return {
      type: 'babel',
      version: '7.0.0',
      program,
    };
  },

  async transform({ asset, config, options }) {
    const distStyleRules: string[] = [];
    let someCode = await asset.getCode();
    for (const match of someCode.matchAll(
      /(import ['"](?<importSpec>.+\.compiled\.css)['"];)|(require\(['"](?<requireSpec>.+\.compiled\.css)['"]\);)/g
    )) {
      const specifierPath = match.groups?.importSpec || match.groups?.requireSpec;
      if (!specifierPath) continue;
      someCode = someCode.replace(match[0], '');
      asset.setCode(someCode);

      const cssFilePath = isAbsolute(specifierPath)
        ? specifierPath
        : join(dirname(asset.filePath), specifierPath);

      const cssContent = (await asset.fs.readFile(cssFilePath)).toString().split('\n');
      if (!asset.meta.styleRules) {
        asset.meta.styleRules = [];
      }
      (asset.meta.styleRules as string[]).push(...cssContent);
    }

    const ast = await asset.getAST();

    if (!ast) {
      // We will only receive ASTs for assets we're interested in.
      // Since this is undefined (or in node modules) we aren't interested in it.
      return [asset];
    }

    // Disable stylesheet extraction locally due to https://github.com/atlassian-labs/compiled/issues/1306
    const extract = config.extract && options.mode !== 'development';
    const includedFiles: string[] = [];
    const code = asset.isASTDirty() ? undefined : await asset.getCode();

    const resolver = ResolverFactory.createResolver({
      fileSystem: new CachedInputFileSystem(fs, 4000),
      ...(config.extensions && {
        extensions: config.extensions,
      }),
      ...(config.resolve ?? {}),
      // This makes the resolver invoke the callback synchronously
      useSyncFileSystemCalls: true,
    });

    const result = await transformFromAstAsync(ast.program, code, {
      code: true,
      ast: false,
      filename: asset.filePath,
      babelrc: false,
      configFile: false,
      sourceMaps: true,
      parserOpts: {
        plugins: config.parserBabelPlugins ?? undefined,
      },
      plugins: [
        ...(config.transformerBabelPlugins ?? []),
        asset.isSource && [
          '@compiled/babel-plugin',
          {
            ...config,
            classNameCompressionMap: config.extract && config.classNameCompressionMap,
            onIncludedFiles: (files: string[]) => includedFiles.push(...files),
            resolver: {
              // The resolver needs to be synchronous, as babel plugins must be synchronous
              resolveSync: (context: string, request: string) => {
                return resolver.resolveSync({}, dirname(context), request);
              },
            },
            cache: false,
          } as BabelPluginOptions,
        ],
        extract && [
          '@compiled/babel-plugin-strip-runtime',
          {
            compiledRequireExclude: true,
          } as BabelStripRuntimePluginOptions,
        ],
      ].filter(toBoolean),
      caller: {
        name: 'compiled',
      },
    });

    const output = result?.code || '';

    includedFiles.forEach((file) => {
      // Included files are those which have been statically evaluated into this asset.
      // This tells parcel that if any of those files change this asset should be transformed
      // again.
      asset.invalidateOnFileChange(file);
    });

    asset.setCode(output);

    if (extract) {
      // Store styleRules to asset.meta to be used by @compiled/parcel-optimizer
      const metadata = result?.metadata as BabelFileMetadata;
      asset.meta.styleRules = [...(metadata.styleRules ?? []), ...distStyleRules];
    }

    return [asset];
  },

  async generate({ asset, ast }) {
    // TODO: We're using babels standard generator. Internally parcel does some hacks in
    // the official Babel transformer to make it faster - using ASTree directly.
    // Perhaps we should do the same thing.
    const { code, map: babelMap } = generate(ast.program, {
      filename: asset.filePath,
      sourceMaps: true,
      sourceFileName: asset.filePath,
    });

    return {
      content: code,
      map: babelMap ? new SourceMap().addVLQMap(babelMap) : null,
    };
  },
});
