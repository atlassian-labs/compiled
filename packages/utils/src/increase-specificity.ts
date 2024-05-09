/** If making any changes to this file, make sure to update `packages/jest/src/utils.ts` as well. */

/**
 * Configuring the babel plugin with `increaseSpecificity: true` will result in this being appended to the end of generated classes.
 */
export const INCREASE_SPECIFICITY_ID = '#\\#';
export const INCREASE_SPECIFICITY_SELECTOR = `:not(${INCREASE_SPECIFICITY_ID})`;
