import { plugin } from 'postcss';

/**
 * Will normalize "currentcolor" and "current-color" to "currentColor".
 */
export const normalizeCurrentColor = plugin('normalize-current-color', () => {
  return (root) => {
    root.walkDecls((rule) => {
      const lowerValue = rule.value.toLowerCase();
      if (lowerValue === 'currentcolor' || lowerValue === 'current-color') {
        rule.value = 'currentColor';
      }
    });
  };
});
