import type { AtRuleInfo, ComparisonOperator, Property } from './types';

// We sort from the smallest value to the biggest value, so the comparison operators will
// take precedence when sorting (> then >= then < then <= then =). When two comparison operators
// are the same, width/height will be sorted.
//
// This roughly follows the mobile-first sorting discussed in
// https://github.com/OlehDutchenko/sort-css-media-queries/tree/master?tab=readme-ov-file#mobile-first
const SORT_ORDER: Record<Property | ComparisonOperator, number> = {
  // e.g. width > 200px
  '>': 10,
  // e.g. width >= 200px. Note that min-width: 200px has been converted to width >= 200px by this point.
  '>=': 20,
  // e.g. width < 200px
  '<': 30,
  // e.g. width <= 200px. Note that max-width: 200px has been converted to width <= 200px by this point.
  '<=': 40,
  // e.g. width = 200px
  '=': 50,

  width: 1,
  height: 2,
};

export const sortAtRules = (rule1: AtRuleInfo, rule2: AtRuleInfo): number => {
  for (let i = 0; i < Math.min(rule1.tokens.length, rule2.tokens.length); i++) {
    const first = rule1.tokens[i];
    const second = rule2.tokens[i];

    const firstSortKey = SORT_ORDER[first.property] + SORT_ORDER[first.comparisonOperator];
    const secondSortKey = SORT_ORDER[second.property] + SORT_ORDER[second.comparisonOperator];

    if (firstSortKey - secondSortKey !== 0) {
      return firstSortKey - secondSortKey;
    }

    // Ensure that min-width (>=) is sorted from smallest to biggest,
    // but max-width (<=) is sorted from biggest to smallest.
    if (first.length - second.length !== 0) {
      return first.comparisonOperator.includes('>')
        ? first.length - second.length
        : second.length - first.length;
    }
  }

  // If one at-rule is "@media (width < 200px)" and another is "@media (width < 200px and something else)", the second at-rule should come after the first.
  if (rule2.tokens.length || rule1.tokens.length) {
    return rule1.tokens.length - rule2.tokens.length;
  }

  return rule1.query.localeCompare(rule2.query, 'en');
};
