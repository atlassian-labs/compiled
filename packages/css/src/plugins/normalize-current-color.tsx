import type { Plugin } from 'postcss';

/**
 * Will normalize "currentcolor" and "current-color" to "currentColor".
 */
export const normalizeCurrentColor = (): Plugin => {
  return {
    postcssPlugin: 'normalize-current-color',
    OnceExit(root) {
      root.walkDecls((rule) => {
        const lowerValue = rule.value.toLowerCase();
        if (lowerValue === 'currentcolor' || lowerValue === 'current-color') {
          rule.value = 'currentColor';
        }
      });
    },
  };
};

export const postcss = true;
