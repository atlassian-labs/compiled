import type { ChildNode, Rule, Plugin, AtRule, Comment, Declaration } from 'postcss';

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
      const catchAll: (Comment | Declaration)[] = [];
      const rules: Rule[] = [];
      const atRules: AtRuleInfo[] = [];

      root.each((node) => {
        switch (node.type) {
          case 'rule': {
            // console.log(node.type, node.nodes[1].prop);
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
      sortDeclarations(rules);
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

const sortDeclarations = (rules: Rule[]): void => {
  rules.sort((rule1, rule2) => {
    const rule1Node = rule1.nodes[0];
    const rule2Node = rule2.nodes[0];
    if (rule1Node.type === 'decl' && rule2Node.type === 'decl') {
      const prop1 = rule1Node.prop;
      const prop2 = rule2Node.prop;
      return propertyOrdering.indexOf(prop1) - propertyOrdering.indexOf(prop2);
    } else {
      return 0;
    }
  });
};

const propertyOrdering = [
  'font-family',
  'font-size',
  'font-stretch',
  'font-style',
  'font-variant',
  'font-weight',
  'line-height',
];
