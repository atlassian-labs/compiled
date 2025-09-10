import { join } from 'path';

import { transformAsync as babelTransformAsync } from '@babel/core';
import { DEFAULT_IMPORT_SOURCES, DEFAULT_PARSER_BABEL_PLUGINS, toBoolean } from '@compiled/utils';
import { Transformer } from '@parcel/plugin';
import SourceMap from '@parcel/source-map';
// swc types don't export TransformOutput type in some versions; use any
import { transformSync } from '@swc/core';
// determine enablement using simple string contains to avoid requiring TS sources

import type { ParcelTransformerSwcOpts } from './types';

const configFiles = [
  '.compiledcssrc',
  '.compiledcssrc.json',
  'compiledcss.js',
  'compiledcss.config.js',
];

const packageKey = '@compiled/parcel-transformer-swc';

export default new Transformer<ParcelTransformerSwcOpts>({
  async loadConfig({ config, options }) {
    const conf = await config.getConfigFrom<ParcelTransformerSwcOpts>(
      join(options.projectRoot, 'index'),
      configFiles,
      { packageKey }
    );

    const contents: ParcelTransformerSwcOpts = {
      extract: true,
      importSources: DEFAULT_IMPORT_SOURCES,
      runtimeImport: '@compiled/react/runtime',
    };

    if (conf) {
      if (conf.filePath.endsWith('.js')) {
        config.invalidateOnStartup();
      }
      Object.assign(contents, conf.contents);
    }

    return contents;
  },

  canReuseAST() {
    return false;
  },

  async parse() {
    return undefined;
  },

  async transform({ asset, config, options }) {
    const extract = config.extract && options.mode !== 'development';

    if (!asset.isSource && !extract) {
      return [asset];
    }

    const code = await asset.getCode();

    const allImportSources = [...DEFAULT_IMPORT_SOURCES, ...(config.importSources || [])];
    const shouldProcess = allImportSources.some((src) => code.includes(src));
    if (!shouldProcess) {
      return [asset];
    }

    const swcMode = config.swc;
    let transformed = false;
    let outCode: string | undefined;
    let outMap: any | undefined;
    let outStyleRules: string[] = [];
    let outIncludedFiles: string[] = [];

    // Attempt SWC first when swc === true or 'auto'
    if (swcMode === true || swcMode === 'auto') {
      try {
        const swcPluginOptions: any = {
          importSources: config.importSources || DEFAULT_IMPORT_SOURCES,
          development: options.mode !== 'production',
          runtimeImport: config.runtimeImport || '@compiled/react/runtime',
          extract,
        };
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const getSwcPlugin2: any = require('@compiled/swc-plugin').getSwcPlugin2;
        const [wasmPath, pluginConfig] = getSwcPlugin2(swcPluginOptions);
        const enablePlugin = asset.isSource === true;
        const hasJsxPragma = /\/\*\*\s*@jsx\s+\w+\s*\*\//.test(code);
        if (enablePlugin) {
          const swcResult: any = transformSync(code, {
            filename: asset.filePath,
            sourceMaps: !!asset.env.sourceMap,
            cwd: process.cwd(),
            jsc: {
              target: 'esnext',
              externalHelpers: true,
              parser: {
                syntax: asset.type === 'ts' || asset.type === 'tsx' ? 'typescript' : 'ecmascript',
                tsx:
                  asset.type === 'tsx' ||
                  asset.filePath.endsWith('.tsx') ||
                  asset.filePath.endsWith('.jsx'),
                jsx: asset.filePath.endsWith('.jsx') || asset.filePath.endsWith('.tsx'),
              } as any,
              transform: {
                react: {
                  runtime: hasJsxPragma ? 'classic' : 'automatic',
                  pragma: hasJsxPragma ? 'jsx' : undefined,
                  pragmaFrag: hasJsxPragma ? 'Fragment' : undefined,
                  development: options.mode !== 'production',
                  importSource: 'react',
                },
              },
              experimental: {
                plugins: enablePlugin ? [[wasmPath, pluginConfig]] : [],
              },
            },
          });

          const styleRules: string[] = [];
          const ruleRegex = /const\s+_[0-9]*\s*=\s*"([\s\S]*?)";/g;
          let match: RegExpExecArray | null;
          while ((match = ruleRegex.exec(swcResult.code)) !== null) {
            const candidate = match[1];
            if (candidate.includes('{') && candidate.includes('}')) {
              styleRules.push(candidate);
            }
          }

          outCode = swcResult.code;
          outMap = swcResult.map;
          outStyleRules = styleRules;
          transformed = true;
        } else {
          // Non-source asset: do not transform, but allow extraction to collect rules from existing code
          if (extract) {
            const styleRules: string[] = [];
            const ruleRegex = /const\s+_[0-9]*\s*=\s*"([\s\S]*?)";/g;
            let match: RegExpExecArray | null;
            while ((match = ruleRegex.exec(code)) !== null) {
              const candidate = match[1];
              if (candidate.includes('{') && candidate.includes('}')) {
                styleRules.push(candidate);
              }
            }
            outStyleRules = styleRules;
          }
          transformed = true;
        }
      } catch (err) {
        if (swcMode === true) {
          throw err;
        }
        // swcMode is 'auto' - fall through to Babel
      }
    }

    if (!transformed) {
      const includedFiles: string[] = [];
      const result: any = await babelTransformAsync(code, {
        code: true,
        ast: false,
        filename: asset.filePath,
        babelrc: false,
        configFile: false,
        sourceMaps: !!asset.env.sourceMap,
        compact: false,
        parserOpts: {
          plugins: DEFAULT_PARSER_BABEL_PLUGINS,
        },
        plugins: [
          [
            '@compiled/babel-plugin',
            {
              importSources: config.importSources || DEFAULT_IMPORT_SOURCES,
              addComponentName: false,
              onIncludedFiles: (files: string[]) => includedFiles.push(...files),
              cache: false,
              runtimeImport: config.runtimeImport || '@compiled/react/runtime',
              development: options.mode !== 'production',
            },
          ],
          extract && [
            '@compiled/babel-plugin-strip-runtime',
            {
              compiledRequireExclude: true,
            },
          ],
        ].filter(toBoolean) as any,
        caller: { name: 'compiled' },
      });

      const styleRules: string[] = [];
      const metadata = result?.metadata as any;
      if (extract && metadata?.styleRules) {
        styleRules.push(...metadata.styleRules);
      }
      outCode = result.code;
      outMap = result.map;
      outStyleRules = styleRules;
      outIncludedFiles = includedFiles;
      transformed = true;
    }

    if (outIncludedFiles.length) {
      outIncludedFiles.forEach((file) => asset.invalidateOnFileChange(file));
    }
    if (extract && outStyleRules.length) {
      asset.meta.styleRules = [
        ...((asset.meta?.styleRules as string[] | undefined) ?? []),
        ...outStyleRules,
      ];
    }

    if (typeof outCode === 'string') {
      asset.setCode(outCode);
    }

    if (outMap && asset.env.sourceMap) {
      const map = new SourceMap(options.projectRoot);
      (map as any).addVLQMap(typeof outMap === 'string' ? JSON.parse(outMap) : outMap);
      asset.setMap(map);
    }

    return [asset];
  },
});
