import postcss from 'postcss';
import { sortAtomicStyleSheet } from './plugins/sort-atomic-style-sheet';

/**
 * Sorts an atomic style sheet.
 *
 * @param stylesheet
 * @returns
 */
export function sort(stylesheet: string): string {
  const result = postcss([sortAtomicStyleSheet()]).process(stylesheet, {
    from: undefined,
  });

  return result.css;
}
