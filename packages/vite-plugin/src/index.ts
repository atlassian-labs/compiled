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
import { createDefaultResolver } from './utils.js';

/**
 * Partition style rules so that cssMapScoped (non-atomic, `.cc-`) rules come
 * first in source order, followed by atomic rules sorted lexically. This
 * ensures:
 * - Non-atomic rules win the cascade over atomic rules (they appear later in
 *   the cascade order WITHIN their bucket — but since they come earlier in
 *   the output we rely on Compiled's sort() to handle final positioning).
 *   Actually the key invariant here is: same source → same output (no churn).
 * - Atomic rules are deterministic across builds, regardless of the order in
 *   which assets were processed.
 *
 * The `.cc-` detection uses `includes` so it matches both bare class selectors
 * (`.cc-xxx{...}`) AND at-rule-wrapped ones (`@media{.cc-xxx{...}}`).
 */
const sortStyleRulesForDeterministicOutput = (styleRules: string[]): string[] => {
  const nonAtomicRules: string[] = [];
  const atomicRules: string[] = [];
  for (const rule of styleRules) {
    if (rule.includes('.cc-')) {
      nonAtomicRules.push(rule);
    } else {
      atomicRules.push(rule);
    }
  }
  atomicRules.sort();
  return [...nonAtomicRules, ...atomicRules];
};

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
  // Map of filePath → array of style rules (in source order from the babel
  // transform). We sort by filePath at extraction time for cross-file
  // determinism, then partition + sort atomic rules for stable output.
  const collectedStyleRulesByFile = new Map<string, string[]>();

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
          // Collect style rules from this file, keyed by filePath for
          // cross-file deterministic ordering at extraction time.
          if (metadata.styleRules && metadata.styleRules.length > 0) {
            collectedStyleRulesByFile.set(id, metadata.styleRules.slice());
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
      if (extract && collectedStyleRulesByFile.size > 0) {
        try {
          // Sort entries by filePath for stable cross-file ordering, then
          // collect all rules. Deduplication happens downstream in `sort()`
          // via `postcss-discard-duplicates`.
          const sortedEntries = [...collectedStyleRulesByFile.entries()].sort(([keyA], [keyB]) =>
            keyA > keyB ? 1 : -1
          );
          const collectedRules: string[] = [];
          for (const [, rules] of sortedEntries) {
            collectedRules.push(...rules);
          }
          const allRules = sortStyleRulesForDeterministicOutput(collectedRules);

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
