import cssnano from 'cssnano-preset-default';
import { Plugin } from 'postcss';
import { normalizeCurrentColor } from './normalize-current-color';

/**
 * These plugins are ran on production builds to ensure the minimal amount of CSS is generated.
 */
const PROD_PLUGINS = [
  // Order CSS declaration values so any combination results in the same atomic rule.
  'postcss-ordered-values',

  // Replace values to equivalent smaller values.
  'postcss-reduce-initial',
  'postcss-convert-values',

  // Normalize color values
  'postcss-colormin',

  // Normalize specific values so they are all equivalent.
  'postcss-normalize-url',
  'postcss-normalize-unicode',
  'postcss-normalize-string',
  'postcss-normalize-positions',
  'postcss-normalize-timing-functions',

  // Make gradients as small as possible.
  'postcss-minify-gradients',

  // Throw away comments
  'postcss-discard-comments',

  // Reduce CSS calc expressions if possible.
  'postcss-calc',
];

/**
 * These plugins are always ran on any run.
 */
const BASE_PLUGINS: string[] = [
  // This ensures all selectors are the same even with different white space
  'postcss-minify-selectors',

  // This ensures all at rules are the same even with different white space
  'postcss-minify-params',
];

/**
 * This plugin runs a subset of the cssnao plugins to normalize CSS during build.
 * During a production build it will run more plugins.
 */
export const normalizeCSS = (): Plugin<never>[] => {
  const preset = cssnano();
  // We exclude async because we need this to run synchronously as ts transformers aren't async!
  const extraPlugins = process.env.NODE_ENV === 'production' ? PROD_PLUGINS : [];
  const pluginsToIncldue = BASE_PLUGINS.concat(extraPlugins);

  const normalizePlugins = preset.plugins
    .map(([creator]: any) => {
      // replicate the `initializePlugin` behavior from https://github.com/cssnano/cssnano/blob/a566cc5/packages/cssnano/src/index.js#L8
      return creator();
    })
    .filter((plugin: any) => {
      return pluginsToIncldue.includes(plugin.postcssPlugin);
    });

  // These plugins are custom ones that gap functionality not provided by cssmin.
  if (process.env.NODE_ENV === 'production') {
    normalizePlugins.push(normalizeCurrentColor);
  }

  return normalizePlugins;
};
