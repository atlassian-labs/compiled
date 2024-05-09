/**
 * This file exists purely because we cannot import @compiled/utils from @compiled/jest
 * without breaking the builds :(
 *
 * If making any changes to this file, make sure to update `packages/utils/src/style-ordering.ts` and `packages/utils/src/increase-specificity.ts` as well.
 */

/**
 * Configuring the babel plugin with `increaseSpecificity: true` will result in this being appended to the end of generated classes.
 */
export const INCREASE_SPECIFICITY_ID = '#\\#';
export const INCREASE_SPECIFICITY_SELECTOR = `:not(${INCREASE_SPECIFICITY_ID})`;

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
