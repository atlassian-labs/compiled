import * as fs from 'fs';

import { parseAsync, transformFromAstAsync } from '@babel/core';
import type { PluginOptions as BabelPluginOptions } from '@compiled/babel-plugin';
import type {
  PluginOptions as BabelStripRuntimePluginOptions,
  BabelFileMetadata,
} from '@compiled/babel-plugin-strip-runtime';
import { sort } from '@compiled/css';
import { DEFAULT_IMPORT_SOURCES, DEFAULT_PARSER_BABEL_PLUGINS, toBoolean } from '@compiled/utils';

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
export default function compiledVitePlugin(userOptions: PluginOptions = {}): any {
  const options: PluginOptions = {
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
  // Track the generated CSS filename for HTML injection
  let generatedCssFileName: string | undefined;

  return {
    name: '@compiled/vite-plugin',
    enforce: 'pre', // Run before other plugins

    load(id: string) {
      // Load .compiled.css files and collect their styles
      if (id.endsWith('.compiled.css')) {
        try {
          if (fs.existsSync(id)) {
            const cssContent = fs.readFileSync(id, 'utf-8');
            // Split by newlines and add each rule to our collection
            const rules = cssContent.split('\n').filter((rule) => rule.trim());
            rules.forEach((rule: string) => collectedStyleRules.add(rule));
          }
        } catch (error) {
          // File may not exist yet, that's ok
        }
        // Return empty module to prevent Vite from trying to process it
        return { code: '', map: null };
      }
      return null;
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

    generateBundle(_outputOptions: any, _bundle: any) {
      // Only generate CSS file if extraction is enabled
      const isDevelopment = process.env.NODE_ENV === 'development';
      const extract = options.extract && !isDevelopment;

      if (!extract || collectedStyleRules.size === 0) {
        return;
      }

      try {
        // Note: Distributed styles from node_modules are collected via the load() hook
        // when .compiled.css files are imported, not by scanning the filesystem

        // Convert Set to array and sort for determinism
        const allRules = Array.from(collectedStyleRules).sort();

        // Join all rules and apply CSS sorting
        const combinedCss = allRules.join('\n');
        const sortConfig = {
          sortAtRulesEnabled: options.sortAtRules,
          sortShorthandEnabled: options.sortShorthand,
        };

        const sortedCss = sort(combinedCss, sortConfig);

        // Emit the CSS file with content-based hashing
        const fileRef = this.emitFile({
          type: 'asset',
          name: 'compiled.css',
          source: sortedCss,
        });

        // Get the generated filename for HTML injection
        generatedCssFileName = this.getFileName(fileRef);
      } catch (error) {
        const err = error as Error;
        this.warn({
          message: `[@compiled/vite-plugin] Failed to generate CSS bundle: ${err.message}`,
        });
      }
    },

    transformIndexHtml: {
      // Run after other plugins to ensure we inject after React plugin processes the HTML
      order: 'post',
      handler() {
        // Only inject CSS link if extraction is enabled
        const isDevelopment = process.env.NODE_ENV === 'development';
        const extract = options.extract && !isDevelopment;

        if (!extract || collectedStyleRules.size === 0) {
          return [];
        }

        // Return HTML transformation descriptor to inject CSS link
        // Use the generated filename (with hash) if available
        const href = generatedCssFileName ? `/${generatedCssFileName}` : '/compiled.css';
        return [
          {
            tag: 'link',
            attrs: {
              rel: 'stylesheet',
              href,
            },
            injectTo: 'head',
          },
        ];
      },
    },
  };
}

export type { PluginOptions as VitePluginOptions };
