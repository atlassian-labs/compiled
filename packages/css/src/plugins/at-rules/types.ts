import type { Node } from 'postcss';

export type Property = 'width' | 'height';
export type ComparisonOperator = '<=' | '=' | '>=' | '<' | '>';
export type LengthUnit = 'ch' | 'em' | 'ex' | 'px' | 'rem';

export type PropertyInfo = {
  // Either 'width' or 'height'.
  //
  // 'max-width', 'min-width', 'max-height', and 'min-height'
  // would be normalised to 'width' or 'height'.
  property: Property;
};

export type OperatorInfo = {
  // We assume that the media query is in the format
  // <normalizedProperty> <comparisonOperator> <length>
  comparisonOperator: ComparisonOperator;
};

export type LengthInfo = {
  length: number;
  // The unit for the length.
  lengthUnit: LengthUnit;
};

export type BasicMatchInfo = {
  // The part of the media query that matched this regular expression.
  match: string;
  // Index where the match was found
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
 * If the original query had
 *
 * * the `<width|height>` and the `<length><lengthUnit>` parts swapped (e.g. `200px >= width`), or
 * * `min-width/max-width/min-height/min-width` instead of `width` and `height` (e.g. `min-width: 200px`),
 *
 * you should normalise this into the `width <= 200px` form before representing it as a `Match`.
 */
type Match = PropertyInfo & OperatorInfo & LengthInfo & BasicMatchInfo;

// Used for Situation 4:
// <length> <comparisonOperator> <width|height> <comparisonOperator2> <length2>
type ExtraComparison = {
  comparisonOperator2: ComparisonOperator;
  length2: number;
  lengthUnit2: LengthUnit;
};

export type ParsedAtRule = Match | (Match & ExtraComparison);

export type Situations = readonly {
  regex: string;
  parser: (match: RegExpMatchArray) => ParsedAtRule | undefined;
}[];

export type AtRuleInfo = {
  tokens: ParsedAtRule[];
  node: Node;
  query: string;
};
