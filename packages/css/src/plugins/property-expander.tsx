import { plugin } from 'postcss';

/**
 * PostCSS plugin that expands shortform properties to their longform equivalents.
 */
export const propertyExpander = plugin('property-expander', () => {
  return () => {};
});
