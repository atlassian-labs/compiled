import type { AtRule, Rule } from 'postcss';

export type Property = 'width' | 'height' | 'device-width' | 'device-height';
export type ComparisonOperator = '<=' | '=' | '>=' | '<' | '>';
export type LengthUnit = 'ch' | 'em' | 'ex' | 'px' | 'rem';

export type PropertyInfo = {
  /**
   * Either 'width' or 'height'.
   *
   * 'max-width', 'min-width', 'max-height', and 'min-height'
   * would be normalised to 'width' or 'height'.
   */
  property: Property;
};

export type OperatorInfo = {
  /** The operator (`<=`, `=`, `>=`, `<`, `>`) being used. */
  comparisonOperator: ComparisonOperator;
};

/**
 * Information about the length and length unit being used (200px, 35rem, etc.)
 */
export type LengthInfo = {
  length: number;
};

export type BasicMatchInfo = {
  /** The part of the media query that matched this regular expression. */
  match: string;
  /** Index where the match was found. */
  index: number;
};

/**
 * Represents some width/height information extracted from a media query (or another
 * at-rule that has the same format), in the normalised form
 * `<width|height> <comparisonOperator> <length><lengthUnit>`. Examples:
 *
 *     width <= 200px
 *     width > 300em
 *     height = 400px
 *     height < 35rem
 *     height >= 50ch
 *
 * If the original query had:
 *
 * - the `<width|height>` and the `<length><lengthUnit>` parts swapped (e.g. `200px >= width`), or
 * - `min-width/max-width/min-height/min-width` instead of `width` and `height` (e.g. `min-width: 200px`),
 *
 * you should normalise this into the `width <= 200px` form before representing it as a `Match`.
 */
export type ParsedAtRule = PropertyInfo & OperatorInfo & LengthInfo & BasicMatchInfo;

export type Situations = readonly {
  regex: string;
  parser: (match: RegExpMatchArray) => ParsedAtRule | undefined;
}[];

export type AtRuleInfo = {
  /** The fully parsed at-rule. */
  parsed: ParsedAtRule[];
  /** The node representing the at-rule. */
  node: Rule | AtRule;
  /** The name of the at-rule, without the @ symbol, e.g. "media", "container", "supports". */
  atRuleName: string;
  /** The original at-rule, without the "@media"/"@supports"/etc. part, e.g. "(screen and max-width: 500px)". */
  query: string;
};
