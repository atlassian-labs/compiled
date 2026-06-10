import type { ChildNode, Rule, Plugin, AtRule } from 'postcss';

import { NON_ATOMIC_CLASS_PREFIX } from '../transform';
import { sortPseudoSelectors } from '../utils/sort-pseudo-selectors';

import { parseMediaQuery } from './at-rules/parse-media-query';
import { sortAtRules } from './at-rules/sort-at-rules';
import type { AtRuleInfo } from './at-rules/types';
import { sortShorthandDeclarations } from './sort-shorthand-declarations';

/**
 * Returns true if the rule contains a non-atomic `cc-` class selector.
 * Non-atomic rules must not be reordered by shorthand or pseudo-selector sorting —
 * their cascade order is already correct by source order.
 */
const isNonAtomicRule = (node: ChildNode): boolean => {
  if (node.type !== 'rule') return false;
  return node.selector.includes(`.${NON_ATOMIC_CLASS_PREFIX}`);
};

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
export const sortAtomicStyleSheet = (config: {
  sortAtRulesEnabled: boolean | undefined;
  sortShorthandEnabled: boolean | undefined;
}): Plugin => {
  const sortAtRulesEnabled = config.sortAtRulesEnabled ?? true;
  const sortShorthandEnabled = config.sortShorthandEnabled ?? true;

  return {
    postcssPlugin: 'sort-atomic-style-sheet',
    Once(root) {
      const catchAll: ChildNode[] = [];
      const atomicRules: Rule[] = [];
      const nonAtomicRules: Rule[] = [];
      const atRules: AtRuleInfo[] = [];

      root.each((node) => {
        switch (node.type) {
          case 'rule': {
            if (isNonAtomicRule(node)) {
              // Non-atomic cc- rules must not be sorted — their source order encodes
              // correct CSS cascade. They are placed at the end after atomic rules.
              nonAtomicRules.push(node);
            } else if (node.first?.type === 'atrule') {
              atRules.push({
                parsed:
                  sortAtRulesEnabled && node.first.name === 'media'
                    ? parseMediaQuery(node.first.params)
                    : [],
                node,
                atRuleName: node.first.name,
                query: node.first.params,
              });
            } else {
              atomicRules.push(node);
            }

            break;
          }

          case 'atrule': {
            atRules.push({
              parsed:
                sortAtRulesEnabled && node.name === 'media' ? parseMediaQuery(node.params) : [],
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

      if (sortShorthandEnabled) {
        // Only sort atomic rules — non-atomic rules preserve source order
        sortShorthandDeclarations(catchAll);
        sortShorthandDeclarations(atomicRules);
        sortShorthandDeclarations(atRules.map((atRule) => atRule.node));
      }

      // Pseudo-selector and at-rule sorting takes priority over shorthand
      // property sorting.
      sortPseudoSelectors(atomicRules);
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

      root.nodes = [
        ...catchAll,
        ...atomicRules,
        ...atRules.map((atRule) => atRule.node),
        // Non-atomic cc- rules are appended after atomic rules, preserving their
        // original source order so that CSS cascade is correct.
        ...nonAtomicRules,
      ];
    },
  };
};

export const postcss = true;
