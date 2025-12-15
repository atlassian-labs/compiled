import { parseAsync, transformFromAstAsync } from '@babel/core';
import type { PluginOptions as BabelPluginOptions } from '@compiled/babel-plugin';
import type {
  PluginOptions as BabelStripRuntimePluginOptions,
  BabelFileMetadata,
} from '@compiled/babel-plugin-strip-runtime';
import { sort } from '@compiled/css';
import { DEFAULT_IMPORT_SOURCES, DEFAULT_PARSER_BABEL_PLUGINS, toBoolean } from '@compiled/utils';
import type { OutputAsset, OutputBundle } from 'rollup';

import type { PluginOptions } from './types';
import { createDefaultResolver } from './utils';

/**
 * Compiled Vite plugin.
 *
 * Transforms CSS-in-JS to atomic CSS at build time using Babel.
 *
 * @param userOptions - Plugin configuration options
 * @returns Vite plugin object
 */
function compiled(userOptions: PluginOptions = {}): any {
  const options: PluginOptions = {
    // Vite-specific
    bake: true,
    extract: false,
    transformerBabelPlugins: undefined,
    ssr: false,
    extractStylesToDirectory: undefined,
    sortShorthand: true,

    // Babel-inherited
    importReact: true,
    nonce: undefined,
    importSources: undefined,
    optimizeCss: true,
    resolver: undefined,
    extensions: undefined,
    parserBabelPlugins: undefined,
    addComponentName: false,
    classNameCompressionMap: undefined,
    processXcss: undefined,
    increaseSpecificity: undefined,
    sortAtRules: true,
    classHashPrefix: undefined,
    flattenMultipleSelectors: undefined,

    ...userOptions,
  };

  // Storage for collected style rules during transformation
  const collectedStyleRules = new Set<string>();

  // Store the emitted CSS filename for HTML injection
  // This gets set in generateBundle after the file is emitted
  let extractedCssFileName: string | undefined;

  // Name used for the extracted CSS asset
  const EXTRACTED_CSS_NAME = 'compiled-extracted.css';

  return {
    name: '@compiled/vite-plugin',
    enforce: 'pre', // Run before other plugins

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

    generateBundle(_outputOptions: any, bundle: OutputBundle) {
      // Post-process CSS assets to apply Compiled's sorting and deduplication
      const isDevelopment = process.env.NODE_ENV === 'development';
      const extract = options.extract && !isDevelopment;

      // Process each CSS asset in the bundle
      for (const [fileName, output] of Object.entries(bundle)) {
        // Only process CSS assets
        if (!fileName.endsWith('.css') || output.type !== 'asset') {
          continue;
        }

        const asset = output as OutputAsset;
        const cssContent = asset.source as string;

        // Check if this CSS contains Compiled atomic classes (starts with underscore)
        // This is a heuristic to identify CSS that came from .compiled.css files
        if (cssContent.includes('._')) {
          try {
            // Apply Compiled's CSS sorting and deduplication
            const sortConfig = {
              sortAtRulesEnabled: options.sortAtRules,
              sortShorthandEnabled: options.sortShorthand,
            };

            const sortedCss = sort(cssContent, sortConfig);

            // Update the asset with sorted CSS
            asset.source = sortedCss;
          } catch (error) {
            const err = error as Error;
            this.warn({
              message: `[@compiled/vite-plugin] Failed to sort CSS in ${fileName}: ${err.message}`,
            });
          }
        }
      }

      // Also emit extracted styles if we collected any from local code
      if (extract && collectedStyleRules.size > 0) {
        try {
          // Convert Set to array and sort for determinism
          const allRules = Array.from(collectedStyleRules).sort();

          // Join all rules and apply CSS sorting
          const combinedCss = allRules.join('\n');
          const sortConfig = {
            sortAtRulesEnabled: options.sortAtRules,
            sortShorthandEnabled: options.sortShorthand,
          };

          const sortedCss = sort(combinedCss, sortConfig);

          // Emit the CSS file with content-based naming
          // Vite will add a content hash to the filename automatically
          this.emitFile({
            type: 'asset',
            name: EXTRACTED_CSS_NAME,
            source: sortedCss,
          });

          // Mark that we've emitted the file so transformIndexHtml can inject it
          // The actual filename will be determined in transformIndexHtml from the bundle
          extractedCssFileName = EXTRACTED_CSS_NAME;
        } catch (error) {
          const err = error as Error;
          this.warn({
            message: `[@compiled/vite-plugin] Failed to generate CSS bundle: ${err.message}`,
          });
        }
      }
    },

    transformIndexHtml(
      _html: string,
      ctx: { bundle?: OutputBundle; [key: string]: any }
    ): { tag: string; attrs: Record<string, string>; injectTo: string }[] {
      // Inject the extracted CSS file into HTML if it was emitted
      if (!extractedCssFileName || !ctx.bundle) {
        return [];
      }

      // Find the emitted CSS asset in the bundle by its name
      // The actual fileName will have a content hash added by Vite
      const cssAsset = Object.values(ctx.bundle).find(
        (asset): asset is OutputAsset => asset.type === 'asset' && asset.name === EXTRACTED_CSS_NAME
      );

      if (!cssAsset) {
        return [];
      }

      return [
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: `/${cssAsset.fileName}`,
          },
          injectTo: 'head',
        },
      ];
    },
  };
}

export { compiled };
export type { PluginOptions as VitePluginOptions };
export default compiled;
