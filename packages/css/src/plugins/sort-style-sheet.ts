import type { AtRule, ChildNode, Container, Plugin, Rule } from 'postcss';

import { isNonAtomicNode } from '../utils/non-atomic';
import { sortPseudoSelectors } from '../utils/sort-pseudo-selectors';

import { parseMediaQuery } from './at-rules/parse-media-query';
import { sortAtRules } from './at-rules/sort-at-rules';
import type { AtRuleInfo } from './at-rules/types';
import { sortShorthandDeclarations } from './sort-shorthand-declarations';

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

const sortNestedAtRules = (container: Container, sortAtRulesEnabled: boolean) => {
  const atRules: AtRuleInfo[] = [];

  container.each((childNode) => {
    if (isNonAtomicNode(childNode)) {
      return;
    }

    if (childNode.type === 'atrule') {
      sortNestedAtRules(childNode, sortAtRulesEnabled);
      atRules.push({
        parsed:
          sortAtRulesEnabled && childNode.name === 'media' ? parseMediaQuery(childNode.params) : [],
        node: childNode,
        atRuleName: childNode.name,
        query: childNode.params,
      });
    } else if (childNode.type === 'rule') {
      sortNestedAtRules(childNode, sortAtRulesEnabled);
    }
  });

  if (!sortAtRulesEnabled || atRules.length < 2 || !container.nodes) {
    return;
  }

  atRules.sort(sortAtRules);
  let atRuleIndex = 0;
  container.nodes = container.nodes.map((childNode) =>
    childNode.type === 'atrule' && !isNonAtomicNode(childNode)
      ? atRules[atRuleIndex++].node
      : childNode
  );
};

/**
 * PostCSS plugin for sorting pseudo-selectors (inside and outside at-rules)
 * based on lvfha ordering, and the at-rules themselves as well.
 *
 * Using Once due to the catchAll behaviour
 */
export const sortStyleSheet = (config: {
  sortAtRulesEnabled: boolean | undefined;
  sortShorthandEnabled: boolean | undefined;
}): Plugin => {
  const sortAtRulesEnabled = config.sortAtRulesEnabled ?? true;
  const sortShorthandEnabled = config.sortShorthandEnabled ?? true;

  return {
    postcssPlugin: 'sort-style-sheet',
    Once(root) {
      const catchAll: ChildNode[] = [];
      const nonAtomicStyles: ChildNode[] = [];
      const atomicRules: Rule[] = [];
      const atomicAtRules: AtRuleInfo[] = [];

      root.each((node) => {
        switch (node.type) {
          case 'rule': {
            if (isNonAtomicNode(node)) {
              // Non-atomic cssMapScoped rules must preserve their source order —
              // skip shorthand and pseudo-selector sorting entirely.
              nonAtomicStyles.push(node);
            } else {
              sortNestedAtRules(node, sortAtRulesEnabled);
              if (node.first?.type !== 'atrule') {
                atomicRules.push(node);
                break;
              }
              atomicAtRules.push({
                parsed:
                  sortAtRulesEnabled && node.first.name === 'media'
                    ? parseMediaQuery(node.first.params)
                    : [],
                node,
                atRuleName: node.first.name,
                query: node.first.params,
              });
            }
            break;
          }

          case 'atrule': {
            if (isNonAtomicNode(node)) {
              // Non-atomic cssMapScoped rules wrapped in at-rules (e.g. @media { .cc-xxx { } })
              // must preserve source order — skip sorting entirely.
              nonAtomicStyles.push(node);
            } else {
              sortNestedAtRules(node, sortAtRulesEnabled);
              atomicAtRules.push({
                parsed:
                  sortAtRulesEnabled && node.name === 'media' ? parseMediaQuery(node.params) : [],
                node,
                atRuleName: node.name,
                query: node.params,
              });
            }
            break;
          }

          default: {
            catchAll.push(node);
          }
        }
      });

      if (sortShorthandEnabled) {
        sortShorthandDeclarations(catchAll);
        sortShorthandDeclarations(atomicRules);
        sortShorthandDeclarations(atomicAtRules.map((atRule) => atRule.node));
      }

      // Pseudo-selector and at-rule sorting takes priority over shorthand
      // property sorting.
      sortPseudoSelectors(atomicRules);
      if (sortAtRulesEnabled) {
        atomicAtRules.sort(sortAtRules);
      }

      for (const atRule of atomicAtRules) {
        const node = atRule.node;
        if (node.type !== 'atrule') {
          continue;
        }
        sortAtRulePseudoSelectors(node);
      }

      // Non-atomic cssMapScoped rules are appended first, preserving their
      // original source order for correct CSS cascade.
      root.nodes = [
        ...nonAtomicStyles,
        ...catchAll,
        ...atomicRules,
        ...atomicAtRules.map((atRule) => atRule.node),
      ];

      // Clear raws.before on the first node to prevent a leading newline in the
      // output when non-atomic rules (which may have raws.before='\n' from being
      // mid-string in the joined input) are moved to the front of the stylesheet.
      if (root.first) {
        root.first.raws.before = '';
      }
    },
  };
};

export const postcss = true;
