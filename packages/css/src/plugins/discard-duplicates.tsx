import { plugin, Declaration } from 'postcss';

/**
 * Discards top level duplicate declarations.
 */
export const discardDuplicates = plugin<{ callback: (sheet: string) => void }>(
  'discard-duplicates',
  () => {
    const decls: Record<string, Declaration[]> = {};

    return (root) => {
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
    };
  }
);
