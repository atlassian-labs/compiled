import type { Plugin } from 'postcss';

const isValueEmpty = (value: string): boolean =>
  value === 'undefined' || value === 'null' || value.trim() === '';

/**
 * Discards any rule with an empty value.
 */
export const discardEmptyRules = (): Plugin => {
  return {
    postcssPlugin: 'discard-empty-rules',
    Declaration(node) {
      if (isValueEmpty(node.value)) {
        const { parent } = node;
        node.remove();

        if (parent?.type === 'rule' && parent.nodes.length === 0) {
          parent.remove();
        }
      }
    },
  };
};

export const postcss = true;
