import postcss from 'postcss';
import discardDuplicates from 'postcss-discard-duplicates';

import { mergeDuplicateAtRules } from './plugins/merge-duplicate-at-rules';
import { sortAtomicStyleSheet } from './plugins/sort-atomic-style-sheet';

/**
 * Sorts an atomic style sheet.
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
    // values set in packages/css/src/plugins/sort-atomic-style-sheet.ts
    //
    // Modify packages/css/src/plugins/sort-atomic-style-sheet.ts if you want to
    // update the actual default values for sortAtRulesEnabled and sortShortEnabled.
    sortAtRulesEnabled: undefined,
    sortShorthandEnabled: undefined,
  }
): string {
  const result = postcss([
    discardDuplicates(),
    mergeDuplicateAtRules(),
    sortAtomicStyleSheet({ sortAtRulesEnabled, sortShorthandEnabled }),
  ]).process(stylesheet, {
    from: undefined,
  });

  return result.css;
}
