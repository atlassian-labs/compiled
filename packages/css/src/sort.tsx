import postcss from 'postcss';
import { sortAtomicStyleSheet } from './plugins/sort-atomic-style-sheet';
import { mergeDuplicateAtRules } from './plugins/merge-duplicate-at-rules';

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
