import postcss from 'postcss';
import discardDuplicates from 'postcss-discard-duplicates';

import { mergeDuplicateAtRules } from './plugins/merge-duplicate-at-rules';
import { sortStyleSheet } from './plugins/sort-style-sheet';

/**
 * Sorts a compiled style sheet.
 *
 * Atomic `cssMap` rules are sorted by shorthand depth, pseudo-selector order,
 * and at-rule specificity. Non-atomic `cssMapScoped` rules preserve their
 * original source order so that CSS cascade is correct.
 *
 * @param stylesheet
 * @returns the sorted stylesheet
 */
export function sort(
  stylesheet: string,
  {
    sortAtRulesEnabled,
    sortShorthandEnabled,
  }: { sortAtRulesEnabled: boolean | undefined; sortShorthandEnabled: boolean | undefined } = {
    // These default values should remain undefined so we don't override the default
    // values set in packages/css/src/plugins/sort-style-sheet.ts
    //
    // Modify packages/css/src/plugins/sort-style-sheet.ts if you want to
    // update the actual default values for sortAtRulesEnabled and sortShortEnabled.
    sortAtRulesEnabled: undefined,
    sortShorthandEnabled: undefined,
  }
): string {
  const result = postcss([
    discardDuplicates(),
    mergeDuplicateAtRules(),
    sortStyleSheet({ sortAtRulesEnabled, sortShorthandEnabled }),
  ]).process(stylesheet, {
    from: undefined,
  });

  return result.css;
}
