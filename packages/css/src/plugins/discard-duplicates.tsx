import type { Plugin, Declaration } from 'postcss';

/**
 * Discards top level duplicate declarations.
 */
export const discardDuplicates = (): Plugin => {
  return {
    Once(root) {
      const decls: Record<string, Declaration[]> = {};

      root.each((node) => {
        if (node.type === 'decl') {
          decls[node.prop] = decls[node.prop] || [];
          decls[node.prop].push(node);
        }
      });

      for (const key in decls) {
        const found = decls[key];
        for (let i = 0; i < found.length - 1; i++) {
          found[i].remove();
        }
      }
    },
    postcssPlugin: 'discard-duplicates',
  };
};

export const postcss = true;
