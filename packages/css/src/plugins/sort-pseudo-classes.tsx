import { plugin, Rule, AtRule } from 'postcss';

const pseudoClassesInOrder = [
  ':link',
  ':visited',
  ':focus-within',
  ':focus',
  ':focus-visible',
  ':hover',
  ':active',
];

const getPseudoClassScore = (selector: string) => {
  const index = pseudoClassesInOrder.findIndex((pseudoClass) =>
    selector.trim().endsWith(pseudoClass)
  );

  return index + 1;
};

const sortPseudoClassesInsideAtRule = (atRule: AtRule) => {
  const rules: Array<Rule> = [];

  atRule.each((childNode) => {
    switch (childNode.type) {
      case 'atrule':
        sortPseudoClassesInsideAtRule(childNode);
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
    .sort(
      (rule1, rule2) => getPseudoClassScore(rule1.selector) - getPseudoClassScore(rule2.selector)
    )
    .forEach((rule) => {
      atRule.append(rule);
    });
};

/**
 * PostCSS plugin for sorting rules based on lvfha rule.
 */
export const sortPseudoClasses = plugin('sort-pseudo-classes', () => {
  return (root) => {
    root.each((node) => {
      switch (node.type) {
        case 'atrule':
          sortPseudoClassesInsideAtRule(node);
          break;

        default:
          break;
      }
    });
  };
});
