import { INCREASE_SPECIFICITY_SELECTOR } from '@compiled/utils';
import type { Plugin } from 'postcss';
import { default as selectorParser, pseudo } from 'postcss-selector-parser';

const parser = selectorParser((root) => {
  root.walkClasses((node) => {
    if (node.parent) {
      node.parent.insertAfter(node, pseudo({ value: INCREASE_SPECIFICITY_SELECTOR }));
    }
  });
});

/**
 * Increase the specificity of classes generated in Compiled by appended ":not(#\\#)".
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
          if (selector.includes('._')) {
            // This rule should only apply to Compiled generated class names.
            return parser.astSync(selector).toString();
          }

          return selector;
        });
      });
    },
  };
};
