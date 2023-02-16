import cssnano from 'cssnano-preset-default';
import type { Plugin } from 'postcss';

import { normalizeCurrentColor } from './normalize-current-color';

interface NormalizeOpts {
  optimizeCss?: boolean;
}

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

  // This ensures all at-rules are the same even with different white space
  'postcss-minify-params',
];

/**
 * This plugin runs cssnao plugins to normalize CSS during build.
 * If consumers opt out the default behaviour, it will run a subset of the plugins.
 *
 * @param opts Transformation options
 */
export const normalizeCSS = (opts: NormalizeOpts): Plugin[] => {
  const { optimizeCss = true } = opts;

  const preset = cssnano();
  // We exclude async because we need this to run synchronously as ts transformers aren't async!
  const extraPlugins = optimizeCss ? PROD_PLUGINS : [];
  const pluginsToInclude = BASE_PLUGINS.concat(extraPlugins);

  const normalizePlugins = preset.plugins
    .map(([creator]: any) => {
      // replicate the `initializePlugin` behavior from https://github.com/cssnano/cssnano/blob/a566cc5/packages/cssnano/src/index.js#L8
      return creator();
    })
    .filter((plugin: any) => {
      return pluginsToInclude.includes(plugin.postcssPlugin);
    });

  // These plugins are custom ones that gap functionality not provided by cssmin.
  if (optimizeCss) {
    normalizePlugins.push(normalizeCurrentColor());
  }

  return normalizePlugins;
};
