import type { ChildNode, Node, Rule, Plugin } from 'postcss';

import { styleOrder } from '../utils/style-ordering';

import { parseAtRule } from './at-rules/parse-at-rule';
import { sortAtRules } from './at-rules/sort-at-rules';
import type { AtRuleInfo } from './at-rules/types';

/**
 * Returns where it should be placed.
 *
 * @param selector
 * @returns
 */
const pseudoSelectorScore = (selector: string) => {
  const index = styleOrder.findIndex((pseudoClass) => selector.trim().endsWith(pseudoClass));
  return index + 1;
};

/**
 * PostCSS plugin for sorting rules inside AtRules based on lvfha ordering.
 * Only top level CSS rules will be sorted.
 *
 * Using Once due to the catchAll behaviour
 */
export const sortAtomicStyleSheet = (): Plugin => {
  return {
    postcssPlugin: 'sort-atomic-style-sheet',
    Once(root) {
      const catchAll: Node[] = [];
      const rules: Rule[] = [];
      const atRules: AtRuleInfo[] = [];

      root.each((node) => {
        switch (node.type) {
          case 'rule': {
            if (node.first?.type === 'atrule') {
              atRules.push({
                parsed: parseAtRule(node.first.params),
                node,
                atRuleName: node.first.name,
                query: node.first.params,
              });
            } else {
              rules.push(node);
            }

            break;
          }

          case 'atrule': {
            atRules.push({
              parsed: parseAtRule(node.params),
              node,
              atRuleName: node.name,
              query: node.params,
            });
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
        return pseudoSelectorScore(selector1) - pseudoSelectorScore(selector2);
      });

      atRules.sort(sortAtRules);

      root.nodes = [...catchAll, ...rules, ...atRules.map((atRule) => atRule.node)] as ChildNode[];
    },
  };
};

export const postcss = true;
