import type { Plugin, Rule, AtRule } from 'postcss';
import { styleOrder } from '../utils/style-ordering';

const getPseudoClassScore = (selector: string) => {
  const index = styleOrder.findIndex((pseudoClass) => selector.trim().endsWith(pseudoClass));
  return index + 1;
};

const sortPseudoClasses = (atRule: AtRule) => {
  const rules: Array<Rule> = [];

  atRule.each((childNode) => {
    switch (childNode.type) {
      case 'atrule':
        sortPseudoClasses(childNode);
        break;

      case 'rule':
        rules.push(childNode.clone());
        childNode.remove();
        break;

      default:
        break;
    }
  });

  rules
    .sort((rule1, rule2) => {
      const selector1 = rule1.selectors.length ? rule1.selectors[0] : rule1.selector;
      const selector2 = rule2.selectors.length ? rule2.selectors[0] : rule2.selector;

      return getPseudoClassScore(selector1) - getPseudoClassScore(selector2);
    })
    .forEach((rule) => {
      atRule.append(rule);
    });
};

/**
 * PostCSS plugin for sorting rules inside AtRules based on lvfha ordering.
 */
export const sortAtRulePseudos = (): Plugin => {
  return {
    postcssPlugin: 'sort-at-rule-pseudos',
    Once(root) {
      root.each((node) => {
        switch (node.type) {
          case 'atrule':
            sortPseudoClasses(node);
            break;

          default:
            break;
        }
      });
    },
  };
};

module.exports.postcss = true;
