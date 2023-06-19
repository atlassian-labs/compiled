import type { CustomAtRules, Visitor } from 'lightningcss';

/**
 * Normalizes "current-color" to "currentColor"
 */
export const normalizeCurrentColor = (): Visitor<CustomAtRules> => ({
  Token(token) {
    if (token.type !== 'ident' || token.value.toLowerCase() !== 'current-color') {
      return;
    }

    return {
      type: 'color',
      value: {
        type: 'currentcolor',
      },
    };
  },
});
