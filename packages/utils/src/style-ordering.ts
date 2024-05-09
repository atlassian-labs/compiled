import type { Rule } from 'postcss';

/** If making any changes to this file, make sure to update `packages/jest/src/utils.ts` as well. */

/**
 * Ordered style buckets using the long psuedo selector.
 * If changes make sure that it aligns with the definition in `packages/react/src/runtime/sheet.tsx`.
 */
const styleOrder: readonly string[] = [
  ':link',
  ':visited',
  ':focus-within',
  ':focus',
  ':focus-visible',
  ':hover',
  ':active',
];

export const getPseudoSelectorScore = (selector: string): number => {
  return styleOrder.findIndex((pseudoClass) => selector.trim().endsWith(pseudoClass));
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
