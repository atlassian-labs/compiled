import postcss from 'postcss';

import { mergeDuplicateAtRules } from './plugins/merge-duplicate-at-rules';
import { sortAtomicStyleSheet } from './plugins/sort-atomic-style-sheet';

/**
 * Sorts an atomic style sheet.
 *
 * @param stylesheet
 * @returns
 */
export function sort(stylesheet: string): string {
  const result = postcss([mergeDuplicateAtRules(), sortAtomicStyleSheet()]).process(stylesheet, {
    from: undefined,
  });

  return result.css;
}
