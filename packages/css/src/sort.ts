import postcss from 'postcss';
import discardDuplicates from 'postcss-discard-duplicates';

import { mergeDuplicateAtRules } from './plugins/merge-duplicate-at-rules';
import { sortAtomicStyleSheet } from './plugins/sort-atomic-style-sheet';

/**
 * Sorts an atomic style sheet.
 *
 * @param stylesheet
 * @returns
 */
export function sort(
  stylesheet: string,
  {
    sortAtRulesEnabled,
    sortShorthandEnabled,
  }: { sortAtRulesEnabled: boolean | undefined; sortShorthandEnabled: boolean | undefined }
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
