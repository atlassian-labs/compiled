import type { CustomAtRules, Rule, Visitor } from 'lightningcss';

const pseudoSelectorOrder = [
  'link',
  'visited',
  'focus-within',
  'focus',
  'focus-visible',
  'hover',
  'active',
];

function getScore(nestedRule: Rule) {
  if (nestedRule.type !== 'style' || nestedRule.value.selectors.length !== 1) {
    return 0;
  }

  const firstSelector = nestedRule.value.selectors[0];
  // This doesn't handle selectors like div:hover:focus, but it could
  const firstSelectorComponent = firstSelector[0];
  if (firstSelectorComponent.type !== 'pseudo-class') {
    // Does not preserve original order, but could if you track original pos
    return pseudoSelectorOrder.length + 1;
  }

  return pseudoSelectorOrder.findIndex(p => p === firstSelectorComponent.kind) + 1;
}

/**
 * Sorts at rules based on lvfha ordering
 */
export const sortAtRulePseudosVisitor = (): Visitor<CustomAtRules> => ({
  Rule(rule) {
    // @ts-expect-error
    console.log('rule', JSON.stringify(rule));
    if (!rule.value?.rules) {
      return;
    }

    return {
      ...rule,
      value: {
        // @ts-expect-error
        ...rule.value,
        // @ts-expect-error
        rules: rule.value.rules.sort((r1, r2) => {
          return getScore(r1) - getScore(r2);
        }),
      }
    }
  }
});
