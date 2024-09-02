import type {
  Compilation as CompilationType,
  Compiler,
  sources,
  RuleSetRule,
  WebpackOptionsNormalized,
} from 'webpack';

/**
 * Helper function to set plugin configured option on the @compiled/webpack-loader
 *
 * @param use
 * @param pluginName
 */
const setOptionOnCompiledWebpackLoader = (use: RuleSetRule['use'], pluginName: string) => {
  if (!use || !Array.isArray(use) || !use.length) {
    return;
  }

  for (const nestedUse of use) {
    if (
      nestedUse &&
      typeof nestedUse === 'object' &&
      (nestedUse.loader === '@compiled/webpack-loader' ||
        nestedUse.loader?.includes('/node_modules/@compiled/webpack-loader'))
    ) {
      const { options } = nestedUse;
      if (options !== undefined && typeof options === 'object' && options.extract !== undefined) {
        options[pluginName] = true;
      }
    }
  }
};

/**
 * Sets an option on the plugin config to tell loaders that the plugin has been configured.
 * Bundling will throw if this option is missing (i.e. consumers did not setup correctly).
 *
 * @param rules
 * @param pluginName
 * @returns
 */
export const setPluginConfiguredOption = (
  rules: WebpackOptionsNormalized['module']['rules'],
  pluginName: string
): void => {
  for (const r of rules) {
    if (!r) {
      continue;
    }

    const rule = r as RuleSetRule;
    const nestedRules = rule.oneOf ?? rule.rules;
    if (nestedRules) {
      for (const nestedRule of nestedRules) {
        if (nestedRule) {
          setOptionOnCompiledWebpackLoader(nestedRule.use, pluginName);
        }
      }
    } else {
      setOptionOnCompiledWebpackLoader(rule.use, pluginName);
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
