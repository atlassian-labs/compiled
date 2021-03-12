import { plugin } from 'postcss';

/**
 * PostCSS plugin for sorting rules inside AtRules based on lvfha ordering.
 */
export const sortAtRulePseudos = plugin('sort-atomic-style-sheet', () => {
  return () => {};
});
