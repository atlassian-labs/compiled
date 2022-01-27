import type { Compilation as CompilationType, Compiler, sources, RuleSetRule } from 'webpack';

/**
 * Sets an option on the plugin config to tell loaders that the plugin has been configured.
 * Bundling will throw if this option is missing (i.e. consumers did not setup correctly).
 *
 * @param rules
 * @param pluginName
 * @returns
 */
export const setPluginConfiguredOption = (
  rules: (RuleSetRule | '...')[],
  pluginName: string
): void => {
  for (const rule of rules) {
    const use = (rule as RuleSetRule).use;
    if (!use || typeof use === 'string') {
      continue;
    }
    if (Array.isArray(use)) {
      if (!use.length) {
        continue;
      }
      for (const nestedUse of use) {
        if (typeof nestedUse !== 'object' || nestedUse.loader !== '@compiled/webpack-loader') {
          continue;
        }
        const { options } = nestedUse;
        if (!options || typeof options !== 'object' || !options.extract) {
          continue;
        }
        options[pluginName] = true;
      }
    } else {
      if (typeof use === 'object' && use.loader === '@compiled/webpack-loader') {
        const { options } = use;
        if (!options || typeof options !== 'object' || !options.extract) {
          continue;
        }
        options[pluginName] = true;
      }
    }
  }
};

/**
 * Returns the string representation of an assets source.
 *
 * @param source
 * @returns
 */
export const getAssetSourceContents = (assetSource: sources.Source): string => {
  const source = assetSource.source();
  if (typeof source === 'string') {
    return source;
  }

  return source.toString();
};

/**
 * Returns a webpack 4 & 5 compatible hook for optimizing assets.
 *
 * @param compilation
 * @returns
 */
export const getOptimizeAssetsHook = (
  compiler: Compiler,
  compilation: CompilationType
): { tap: CompilationType['hooks']['processAssets']['tap'] } => {
  const { Compilation, version } =
    // Webpack 5 flow
    compiler.webpack ||
    // Webpack 4 flow
    require('webpack');
  const isWebpack4 = version.startsWith('4.');
  const optimizeAssets =
    // Webpack 5 flow
    compilation.hooks.processAssets ||
    // Webpack 4 flow
    compilation.hooks.optimizeAssets;

  return {
    tap: (pluginName: string, callback: (assets: CompilationType['assets']) => void) => {
      optimizeAssets.tap(
        isWebpack4
          ? pluginName
          : {
              name: pluginName,
              stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
            },
        callback
      );
    },
  };
};

/**
 * Returns webpack 4 & 5 compatible sources.
 * @returns
 */
export const getSources = (compiler: Compiler): typeof sources => {
  const { sources } =
    // Webpack 5 flow
    compiler.webpack ||
    // Webpack 4 flow
    {};

  return (
    // Webpack 5 flow
    sources ||
    // Webpack 4 flow
    require('webpack-sources')
  );
};

/**
 * Escapes a CSS rule to be a valid query param.
 * Also escapes escalamation marks (!) to not confuse webpack.
 *
 * @param rule
 * @returns
 */
export const toURIComponent = (rule: string): string => {
  const component = encodeURIComponent(rule).replace(/!/g, '%21');

  return component;
};
