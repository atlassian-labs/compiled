import { join } from 'path';

import { parseAsync, transformFromAstAsync } from '@babel/core';
import generate from '@babel/generator';
import type { PluginOptions as BabelPluginOptions } from '@compiled/babel-plugin';
import type {
  PluginOptions as BabelStripRuntimePluginOptions,
  BabelFileMetadata,
} from '@compiled/babel-plugin-strip-runtime';
import { DEFAULT_IMPORT_SOURCES, DEFAULT_PARSER_BABEL_PLUGINS, toBoolean } from '@compiled/utils';
import { Transformer } from '@parcel/plugin';
import SourceMap from '@parcel/source-map';
// @ts-expect-error missing type
import { relativeUrl } from '@parcel/utils';

import type { ParcelTransformerOpts } from './types';
import { createDefaultResolver } from './utils';

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
    if (
      // If neither Compiled (default) nor any of the additional import sources are found in the code, we bail out.
      [...DEFAULT_IMPORT_SOURCES, ...(config.importSources || [])].every(
        (importSource) => !code.includes(importSource)
      )
    ) {
      // We only want to parse files that are actually using Compiled.
      // For everything else we bail out.
      return undefined;
    }

    const program = await parseAsync(code, {
      filename: asset.filePath,
      babelrc: false,
      configFile: false,
      caller: { name: 'compiled' },
      rootMode: 'upward-optional',
      parserOpts: {
        plugins: config.parserBabelPlugins ?? DEFAULT_PARSER_BABEL_PLUGINS,
      },
      plugins: config.transformerBabelPlugins ?? undefined,
    });

    if (program) {
      return {
        type: 'babel',
        version: '7.0.0',
        program,
      };
    }

    return undefined;
  },

  async transform({ asset, config, options }) {
    if (config.extract && config.classHashPrefix) {
      throw new Error(
        '`@compiled/parcel-transformer` is mixing `extract: true` and `classHashPrefix` options, which will not supported and will result in bundle size bloat.'
      );
    }

    const ast = await asset.getAST();

    if (!(ast?.type === 'babel' && ast.program)) {
      // We will only receive ASTs for assets we're interested in.
      // Since this is undefined (or in node modules) we aren't interested in it.
      return [asset];
    }

    // Disable stylesheet extraction locally due to https://github.com/atlassian-labs/compiled/issues/1306
    const extract = config.extract && options.mode !== 'development';
    const includedFiles: string[] = [];
    const code = asset.isASTDirty() ? undefined : await asset.getCode();

    const result = await transformFromAstAsync(ast.program, code, {
      code: false,
      ast: true,
      filename: asset.filePath,
      babelrc: false,
      configFile: false,
      sourceMaps: !!asset.env.sourceMap,
      compact: false,
      parserOpts: {
        plugins: config.parserBabelPlugins ?? DEFAULT_PARSER_BABEL_PLUGINS,
      },
      plugins: [
        ...(config.transformerBabelPlugins ?? []),
        asset.isSource && [
          '@compiled/babel-plugin',
          {
            ...config,
            classNameCompressionMap: config.extract && config.classNameCompressionMap,
            onIncludedFiles: (files: string[]) => includedFiles.push(...files),
            resolver: config.resolver ? config.resolver : createDefaultResolver(config),
            cache: false,
          } as BabelPluginOptions,
        ],
        extract && [
          '@compiled/babel-plugin-strip-runtime',
          {
            compiledRequireExclude: true,
            extractStylesToDirectory: config.extractStylesToDirectory,
          } as BabelStripRuntimePluginOptions,
        ],
      ].filter(toBoolean),
      caller: {
        name: 'compiled',
      },
    });

    includedFiles.forEach((file) => {
      // Included files are those which have been statically evaluated into this asset.
      // This tells parcel that if any of those files change this asset should be transformed
      // again.
      asset.invalidateOnFileChange(file);
    });

    if (extract) {
      // Store styleRules to asset.meta to be used by @compiled/parcel-optimizer
      const metadata = result?.metadata as BabelFileMetadata;
      asset.meta.styleRules = [
        ...((asset.meta?.styleRules as string[] | undefined) ?? []),
        ...(metadata.styleRules ?? []),
      ];
    }

    if (result?.ast) {
      asset.setAST({
        type: 'babel',
        version: '7.0.0',
        program: result.ast,
      });
    }

    return [asset];
  },

  async generate({ asset, ast, options }) {
    const originalSourceMap = await asset.getMap();
    const sourceFileName: string = relativeUrl(options.projectRoot, asset.filePath);

    // @ts-expect-error RawMappings should exist here
    const { code, rawMappings } = generate(ast.program, {
      sourceFileName,
      sourceMaps: !!asset.env.sourceMap,
      comments: true,
    });

    const map = new SourceMap(options.projectRoot);
    if (rawMappings) {
      map.addIndexedMappings(rawMappings);
    }

    if (originalSourceMap) {
      // The babel AST already contains the correct mappings, but not the source contents.
      // We need to copy over the source contents from the original map.
      // @ts-expect-error getSourcesContentMap exists
      const sourcesContent = originalSourceMap.getSourcesContentMap();
      for (const filePath in sourcesContent) {
        const content = sourcesContent[filePath];
        if (content != null) {
          map.setSourceContent(filePath, content);
        }
      }
    }

    return {
      content: code,
      map,
    };
  },
});
