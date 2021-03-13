import postcss from 'postcss';
import { sortAtomicStyleSheet } from './plugins/sort-atomic-style-sheet';
import { discardDuplicateAtRuleChildren } from './plugins/discard-duplicate-at-rule-children';

/**
 * Sorts an atomic style sheet.
 *
 * @param stylesheet
 * @returns
 */
export function sort(stylesheet: string): string {
  const result = postcss([discardDuplicateAtRuleChildren(), sortAtomicStyleSheet()]).process(
    stylesheet,
    {
      from: undefined,
    }
  );

  return result.css;
}
