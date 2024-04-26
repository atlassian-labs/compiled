import type { Rule } from 'postcss';

import { styleOrder } from './style-ordering';

const getPseudoSelectorScore = (selector: string) => {
  const index = styleOrder.findIndex((pseudoClass) => selector.trim().endsWith(pseudoClass));
  return index + 1;
};

/**
 * Given a list of CSS rules, sort the rules in-place such that the pseudo-selectors are
 * sorted with the ordering defined in `packages/css/src/utils/style-ordering.ts`.
 *
 * @param rules
 */
export const sortPseudoSelectors = (rules: Rule[]): void => {
  rules.sort((rule1, rule2) => {
    const selector1 = rule1.selectors.length ? rule1.selectors[0] : rule1.selector;
    const selector2 = rule2.selectors.length ? rule2.selectors[0] : rule2.selector;
    return getPseudoSelectorScore(selector1) - getPseudoSelectorScore(selector2);
  });
};
