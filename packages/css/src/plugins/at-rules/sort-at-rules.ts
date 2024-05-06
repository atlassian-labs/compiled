import type { AtRuleInfo, ComparisonOperator, ParsedAtRule, Property } from './types';

/**
 * This allows us to sort from the smallest value to the biggest value, so the
 * comparison operators will take precedence when sorting (`>` then `>=` then `<`
 * then `<=` then `=`). When two comparison operators are the same, width/height
 * will be sorted.
 */
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

  // Ensures that device-width, device-height, min/max-device-width, min/max-device-height
  // will come after width, height, min/max-width, min/max-height.
  'device-width': 101,
  'device-height': 102,
};

const getSortKey = (rule: ParsedAtRule): number => {
  return SORT_ORDER[rule.property] + SORT_ORDER[rule.comparisonOperator];
};

/**
 * Basic sorting function for at-rules.
 *
 * We follow these principles:
 *
 * - We first sort by the name of the at-rule, e.g. `@media`, `@supports`.
 * - Then we sort by the rest of the at-rule.
 *   - If it does not contain a parse-able length and comparison of some kind (e.g. `width < XYZ`, `min-width: XYZ`), it will be sorted alphabetically (e.g. `@media screen`).
 *   - Otherwise, we extract the strings that contain a comparison involving width/height,
 *     e.g. `width < XYZ`, `height >= XYZ`, `device-height <= XYZ`, `device-width > XYZ`
 *     (or strings that can be normalised to this format, e.g. `XYZ > width`), and we
 *     sort at-rules in the following way:
 *
 *     1. `width > XYZ`, `height > XYZ`
 *     2. `width >= XYZ`, `height >= XYZ`
 *     3. `width < XYZ`, `height < XYZ`
 *     4. `width <= XYZ`, `height <= XYZ`
 *     5. `width = XYZ`, `height = XYZ`
 *     6. `device-width` and `device-height` are sorted in the same manner as above.
 *
 * Note that:
 *
 * - The length XYZ must be a number; complex expressions such as ratios and `calc()` will not be parsed.
 * - `min-width: XYZ` is equivalent to `width >= XYZ` (same for `min-height`)
 * - `max-width: XYZ` is equivalent to `width <= XYZ` (same for `max-height`)
 * - `min-device-width: XYZ`, `max-device-width: XYZ`, `min-device-height`,
 *   and `max-device-height` are converted to `device-width` and `device-height` in a similar manner.
 * - If the at-rule does not contain a string in this format (e.g. `@media print`), it
 *     will appear before at-rules that do (e.g. `@media print and (max-width: XYZ)`).
 *
 * This is a variation of the mobile-first sorting discussed in
 * https://github.com/OlehDutchenko/sort-css-media-queries/tree/master?tab=readme-ov-file#mobile-first
 *
 * @param rule1 Information about the first at-rule. We assume this has already been parsed by `parseAtRule`.
 * @param rule2 Information about the second at-rule, We assume this has already been parsed by `parseAtRule`.
 */
export const sortAtRules = (rule1: AtRuleInfo, rule2: AtRuleInfo): number => {
  // This ensures that @layer comes before @media, which comes before @supports.
  const compareAtRuleName = rule1.atRuleName.localeCompare(rule2.atRuleName, 'en');
  if (compareAtRuleName !== 0) {
    return compareAtRuleName;
  }

  for (let i = 0; i < Math.min(rule1.parsed.length, rule2.parsed.length); i++) {
    const first = rule1.parsed[i];
    const second = rule2.parsed[i];

    const firstSortKey = getSortKey(first);
    const secondSortKey = getSortKey(second);

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

  // If one at-rule is "@media (width < 200px)" and another has more conditions, such as
  // "@media (width < 200px and something else)", the second at-rule should come after
  // the first.
  if (
    rule2.parsed.length + rule1.parsed.length > 0 &&
    rule1.parsed.length !== rule2.parsed.length
  ) {
    return rule1.parsed.length - rule2.parsed.length;
  }

  return rule1.query.localeCompare(rule2.query, 'en');
};
