import cssnano from 'cssnano-preset-default';

/**
 * PostCSS `cssnano` plugin to minify CSS.
 * It deliberately excludes some plugins so it is forced to be synchronous.
 */
export const minify = () => {
  const preset = cssnano();
  // We exclude async because we need this to run synchronously as ts transformers aren't async!
  const asyncPluginsToExclude = ['postcss-svgo', 'postcss-normalize-charset'];

  return preset.plugins
    .map(([creator]: any) => {
      // replicate the `initializePlugin` behavior from https://github.com/cssnano/cssnano/blob/a566cc5/packages/cssnano/src/index.js#L8
      return creator();
    })
    .filter((plugin: any) => {
      return !asyncPluginsToExclude.includes(plugin.postcssPlugin);
    });
};
