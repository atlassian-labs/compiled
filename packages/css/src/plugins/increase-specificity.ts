import type { Plugin } from 'postcss';

const INCREASE_SPECIFICITY_SELECTOR = ':not(#\\9)';

/**
 * Increase the specificity of classes generated in Compiled by prepending ":not(#\\9)".
 * This rule should run after CSS declarations have been atomicized and should not affect
 * the original generated class name.
 *
 * This means generated class names with / without the increased specificity are the same,
 * so when running Compiled together with (in product) + without it (in platform) they will
 * keep the deterministic behaviour of the last declared style wins, but enjoying increased
 * specificity when used in non-Compiled contexts for migration purposes, e.g. xcss prop
 * being passed to Emotion CSS-in-JS!
 */
export const increaseSpecificity = (): Plugin => {
  return {
    postcssPlugin: 'increase-specificity',
    OnceExit(root) {
      root.walkRules((rule) => {
        rule.selectors = rule.selectors.map((selector) => {
          if (selector.startsWith('.')) {
            return INCREASE_SPECIFICITY_SELECTOR + ' ' + selector;
          }

          return selector;
        });
      });
    },
  };
};
