import type { Plugin } from 'postcss';

/**
 * Will normalize "currentcolor" and "current-color" to "currentColor".
 */
export const normalizeCurrentColor = (): Plugin => {
  return {
    postcssPlugin: 'normalize-current-color',
    Declaration(declaration) {
      const lowerValue = declaration.value.toLowerCase();
      if (lowerValue === 'currentcolor' || lowerValue === 'current-color') {
        declaration.value = 'currentColor';
      }
    },
  };
};

export const postcss = true;
