import { join } from 'path';

import { DEFAULT_IMPORT_SOURCES } from '@compiled/utils';
import { Transformer } from '@parcel/plugin';
import SourceMap from '@parcel/source-map';
// swc types don't export TransformOutput type in some versions; use any
import { transform } from '@swc/core';
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

    const code = await asset.getCode();

    const importSources = config.importSources || DEFAULT_IMPORT_SOURCES;
    const hasCompiledImport = importSources.some((src) => {
      const fromRe = new RegExp(`from\\s+['"]${src}['"]`);
      const reqRe = new RegExp(`require\\(\\s*['"]${src}['"]\\s*\\)`);
      const dynRe = new RegExp(`import\\(\\s*['"]${src}['"]\\s*\\)`);
      return fromRe.test(code) || reqRe.test(code) || dynRe.test(code);
    });
    const hasApiUsage = /\b(css|xcss)\s*=|\b(css|styled|keyframes|cssMap)\s*\(/.test(code);
    if (!hasCompiledImport && !hasApiUsage) {
      // Nothing to do
      return [asset];
    }

    const swcPluginOptions: any = {
      importSources: config.importSources || DEFAULT_IMPORT_SOURCES,
      development: options.mode !== 'production',
      runtimeImport: config.runtimeImport || '@compiled/react/runtime',
      extract,
    };

    // Resolve at runtime to avoid TS type resolution during build graph
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const getSwcPlugin2: any = require('@compiled/swc-plugin').getSwcPlugin2;
    const [wasmPath, pluginConfig] = getSwcPlugin2(swcPluginOptions);
    const enablePlugin = hasCompiledImport || hasApiUsage;
    const swcResult: any = await transform(code, {
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
            runtime: 'automatic',
            development: options.mode !== 'production',
            importSource: 'react',
          },
        },
        experimental: {
          plugins: enablePlugin ? [[wasmPath, pluginConfig]] : [],
        },
      },
      // Let Parcel handle module bundling
    });

    const styleRules = [] as string[];
    const ruleRegex = /const\s+_[0-9]*\s*=\s*"([\s\S]*?)";/g;
    let match: RegExpExecArray | null;
    while ((match = ruleRegex.exec(swcResult.code)) !== null) {
      const candidate = match[1];
      if (candidate.includes('{') && candidate.includes('}')) {
        styleRules.push(candidate);
      }
    }
    if (extract && styleRules.length) {
      asset.meta.styleRules = [
        ...((asset.meta?.styleRules as string[] | undefined) ?? []),
        ...styleRules,
      ];
    }

    asset.setCode(swcResult.code);

    if (swcResult.map && asset.env.sourceMap) {
      const map = new SourceMap(options.projectRoot);
      (map as any).addVLQMap(
        typeof swcResult.map === 'string' ? JSON.parse(swcResult.map) : swcResult.map
      );
      asset.setMap(map);
    }

    return [asset];
  },
});
