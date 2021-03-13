import { plugin } from 'postcss';
import type { Rule, Node, ChildNode } from 'postcss';
import { styleOrder } from '../utils/style-ordering';

/**
 * Returns where it should be placed.
 *
 * @param selector
 * @returns
 */
const getPseudoClassScore = (selector: string) => {
  const index = styleOrder.findIndex((pseudoClass) => selector.trim().endsWith(pseudoClass));
  return index + 1;
};

/**
 * PostCSS plugin for sorting rules inside AtRules based on lvfha ordering.
 * Only top level CSS rules will be sorted.
 */
export const sortAtomicStyleSheet = plugin('sort-atomic-style-sheet', () => {
  return (root) => {
    const catchAll: Node[] = [];
    const rules: Rule[] = [];
    const atRules: Rule[] = [];

    root.each((node) => {
      switch (node.type) {
        case 'rule': {
          if (node.first?.type === 'atrule') {
            atRules.push(node);
          } else {
            rules.push(node);
          }

          break;
        }

        default: {
          catchAll.push(node);
        }
      }
    });

    rules.sort((rule1, rule2) => {
      const selector1 = rule1.selectors.length ? rule1.selectors[0] : rule1.selector;
      const selector2 = rule2.selectors.length ? rule2.selectors[0] : rule2.selector;
      return getPseudoClassScore(selector1) - getPseudoClassScore(selector2);
    });

    root.nodes = [...catchAll, ...rules, ...atRules] as ChildNode[];
  };
});
