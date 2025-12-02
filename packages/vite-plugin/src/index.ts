import { join } from 'path';

import { parseAsync, transformFromAstAsync } from '@babel/core';
import type { PluginOptions as BabelPluginOptions } from '@compiled/babel-plugin';
import type {
  PluginOptions as BabelStripRuntimePluginOptions,
  BabelFileMetadata,
} from '@compiled/babel-plugin-strip-runtime';
import { DEFAULT_IMPORT_SOURCES, DEFAULT_PARSER_BABEL_PLUGINS, toBoolean } from '@compiled/utils';

import type { CompiledVitePluginOptions } from './types';
import { createDefaultResolver, collectDistributedStyles } from './utils';

// Type for Vite's resolved config
interface ResolvedConfig {
  root?: string;
  [key: string]: unknown;
}

/**
 * Compiled Vite plugin.
 *
 * Transforms CSS-in-JS to atomic CSS at build time using Babel.
 *
 * @param userOptions - Plugin configuration options
 * @returns Vite plugin object
 */
export default function compiledVitePlugin(userOptions: CompiledVitePluginOptions = {}): any {
  const options: CompiledVitePluginOptions = {
    bake: true,
    extract: false,
    importReact: true,
    ssr: false,
    optimizeCss: true,
    addComponentName: false,
    sortAtRules: true,
    sortShorthand: true,
    ...userOptions,
  };

  // Storage for collected style rules during transformation
  const collectedStyleRules = new Set<string>();
  let viteConfig: ResolvedConfig;

  return {
    name: '@compiled/vite-plugin',
    enforce: 'pre', // Run before other plugins

    configResolved(config: any) {
      // Store the resolved Vite config for later use
      viteConfig = config;
    },

    async transform(code: string, id: string): Promise<any> {
      // Filter out node_modules (except for specific includes if needed)
      if (id.includes('/node_modules/@compiled/react')) {
        return null;
      }

      // Only process JS/TS/JSX/TSX files
      if (!/\.[jt]sx?$/.test(id)) {
        return null;
      }

      const importSources = [...DEFAULT_IMPORT_SOURCES, ...(options.importSources || [])];

      // Bail early if Compiled (via an importSource) isn't in the module
      if (!importSources.some((name) => code.includes(name))) {
        return null;
      }

      try {
        const includedFiles: string[] = [];

        // Parse to AST using Babel
        const ast = await parseAsync(code, {
          filename: id,
          babelrc: false,
          configFile: false,
          caller: { name: 'compiled' },
          rootMode: 'upward-optional',
          parserOpts: {
            plugins: options.parserBabelPlugins ?? DEFAULT_PARSER_BABEL_PLUGINS,
          },
          plugins: options.transformerBabelPlugins ?? undefined,
        });

        if (!ast) {
          return null;
        }

        // Disable stylesheet extraction in development mode
        const isDevelopment = process.env.NODE_ENV === 'development';
        const extract = options.extract && !isDevelopment;

        // Transform using the Compiled Babel Plugin
        const result = await transformFromAstAsync(ast, code, {
          babelrc: false,
          configFile: false,
          sourceMaps: true,
          filename: id,
          parserOpts: {
            plugins: options.parserBabelPlugins ?? DEFAULT_PARSER_BABEL_PLUGINS,
          },
          plugins: [
            ...(options.transformerBabelPlugins ?? []),
            options.bake && [
              '@compiled/babel-plugin',
              {
                ...options,
                // Turn off compressing class names if stylesheet extraction is off
                classNameCompressionMap: extract && options.classNameCompressionMap,
                onIncludedFiles: (files: string[]) => includedFiles.push(...files),
                resolver: options.resolver ? options.resolver : createDefaultResolver(options),
                cache: false,
              } as BabelPluginOptions,
            ],
            extract && [
              '@compiled/babel-plugin-strip-runtime',
              {
                compiledRequireExclude: options.ssr || extract,
                extractStylesToDirectory: options.extractStylesToDirectory,
              } as BabelStripRuntimePluginOptions,
            ],
          ].filter(toBoolean),
          caller: {
            name: 'compiled',
          },
        });

        // Store metadata for CSS extraction if enabled
        if (extract && result?.metadata) {
          const metadata = result.metadata as BabelFileMetadata;
          // Collect style rules from this file
          if (metadata.styleRules && metadata.styleRules.length > 0) {
            metadata.styleRules.forEach((rule: string) => collectedStyleRules.add(rule));
          }
        }

        // Return transformed code and source map
        if (result?.code) {
          return {
            code: result.code,
            map: result.map ?? null,
          };
        }

        return null;
      } catch (e: unknown) {
        // Throw error to be displayed by Vite
        const error = e as Error;
        this.error({
          message: `[@compiled/vite-plugin] Failed to transform: ${error.message}`,
          stack: error.stack,
        });
      }
    },

    generateBundle(_outputOptions: any, bundle: any) {
      // Only generate CSS file if extraction is enabled
      const isDevelopment = process.env.NODE_ENV === 'development';
      const extract = options.extract && !isDevelopment;

      if (!extract || collectedStyleRules.size === 0) {
        return;
      }

      try {
        // Collect distributed styles from node_modules
        const nodeModulesPaths: string[] = [];
        if (viteConfig?.root) {
          nodeModulesPaths.push(join(viteConfig.root, 'node_modules'));
        }

        const distributedStyles = collectDistributedStyles(nodeModulesPaths);
        distributedStyles.forEach((rule: string) => collectedStyleRules.add(rule));

        // Convert Set to array and sort for determinism
        const allRules = Array.from(collectedStyleRules).sort();

        // Join all rules and apply CSS sorting
        const combinedCss = allRules.join('\n');
        const sortConfig = {
          sortAtRulesEnabled: options.sortAtRules,
          sortShorthandEnabled: options.sortShorthand,
        };

        // Import sort function dynamically to avoid build issues
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { sort } = require('./sort-css');
        const sortedCss = sort(combinedCss, sortConfig);

        // Emit the CSS file
        const cssFileName = 'compiled.css';
        this.emitFile({
          type: 'asset',
          fileName: cssFileName,
          source: sortedCss,
        });

        // Find the HTML file and inject the CSS link
        for (const fileName in bundle) {
          const file = bundle[fileName] as any;
          if (file.type === 'asset' && fileName.endsWith('.html')) {
            let html = file.source as string;

            // Inject CSS link into the head
            const cssLink = `  <link rel="stylesheet" href="/${cssFileName}">`;
            if (html.includes('</head>')) {
              html = html.replace('</head>', `${cssLink}\n  </head>`);
            } else if (html.includes('<head>')) {
              html = html.replace('<head>', `<head>\n${cssLink}`);
            } else {
              // If no head tag, add one
              html = `<head>\n${cssLink}\n</head>\n${html}`;
            }

            file.source = html;
          }
        }
      } catch (error) {
        const err = error as Error;
        this.warn({
          message: `[@compiled/vite-plugin] Failed to generate CSS bundle: ${err.message}`,
        });
      }
    },
  };
}

export { CompiledVitePluginOptions };
export type { CompiledVitePluginOptions as VitePluginOptions };
