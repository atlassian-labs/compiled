import { plugin } from 'postcss';

/**
 * PostCSS plugin for sorting rules inside AtRules based on lvfha ordering.
 */
export const sortAtomicStyleSheet = plugin('sort-atomic-style-sheet', () => {
  return () => {};
});
