import type { ChildNode, Rule, Plugin, AtRule } from 'postcss';

import { sortPseudoSelectors } from '../utils/sort-pseudo-selectors';

import { parseAtRule } from './at-rules/parse-at-rule';
import { sortAtRules } from './at-rules/sort-at-rules';
import type { AtRuleInfo } from './at-rules/types';

const sortAtRulePseudoSelectors = (atRule: AtRule) => {
  const rules: Rule[] = [];

  atRule.each((childNode) => {
    switch (childNode.type) {
      case 'atrule':
        sortAtRulePseudoSelectors(childNode);
        break;

      case 'rule':
        rules.push(childNode.clone());
        childNode.remove();
        break;

      default:
        break;
    }
  });

  sortPseudoSelectors(rules);
  rules.forEach((rule) => {
    atRule.append(rule);
  });
};

/**
 * PostCSS plugin for sorting pseudo-selectors (inside and outside at-rules)
 * based on lvfha ordering, and the at-rules themselves as well.
 *
 * Only top level CSS rules will be sorted.
 *
 * Using Once due to the catchAll behaviour
 */
export const sortAtomicStyleSheet = (sortAtRulesEnabled: boolean): Plugin => {
  return {
    postcssPlugin: 'sort-atomic-style-sheet',
    Once(root) {
      const catchAll: ChildNode[] = [];
      const rules: Rule[] = [];
      const atRules: AtRuleInfo[] = [];

      root.each((node) => {
        switch (node.type) {
          case 'rule': {
            if (node.first?.type === 'atrule') {
              atRules.push({
                parsed: sortAtRulesEnabled ? parseAtRule(node.first.params) : [],
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
              parsed: sortAtRulesEnabled ? parseAtRule(node.params) : [],
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

      sortPseudoSelectors(rules);
      if (sortAtRulesEnabled) {
        atRules.sort(sortAtRules);
      }

      for (const atRule of atRules) {
        const node = atRule.node;
        if (node.type !== 'atrule') {
          continue;
        }
        sortAtRulePseudoSelectors(node);
      }

      root.nodes = [...catchAll, ...rules, ...atRules.map((atRule) => atRule.node)];
    },
  };
};

export const postcss = true;
