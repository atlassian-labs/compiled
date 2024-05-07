import {
  parseDoubleRangeSyntax,
  parseMinMaxSyntax,
  parseRangeSyntax,
  parseReversedRangeSyntax,
} from './parsers';
import type { ParsedAtRule, Situations } from './types';

const comparisonOperators = /(?<operator>(?:<=?)|(?:>=?)|=)\s*/;
const comparisonOperators2 = /(?<operator2>(?:<=?)|(?:>=?)|=)\s*/;
// Matches min-width, min-height, max-width, max-height,
// min-device-width, min-device-height, max-device-width, max-device-height,
// width, height, device-width, and device-height.
const property = /(?:(?<property>((?:min|max)-)?(?:device-)?(?:width|height))\s*)/;
const colon = /(?<colon>:\s*)/;

const length_ = /(?<length>-?\d*\.?\d+)(?<lengthUnit>ch|em|ex|px|rem)?\s*/;
const length2 = /(?<length2>-?\d*\.?\d+)(?<lengthUnit2>ch|em|ex|px|rem)?\s*/;

/**
 * Extracts and parses breakpoint information from a media query. We define breakpoints as
 * the `min-width`/`max-width`/`min-height`/`max-width`/`width`/`height` parts of a media query.
 *
 * There are four situations that this function can handle (terminology is based on
 * [that from W3C](https://drafts.csswg.org/mediaqueries/)):
 *
 * ### Situation one - min/max syntax
 *
 *     <property>: <length><lengthUnit>
 *
 *     e.g. max-width: 200px
 *
 * ### Situation two - reversed range syntax
 *
 *     <length><lengthUnit> <comparisonOperator> <width|height>
 *
 *     e.g. 200px >= width
 *
 * ### Situation three - range syntax
 *
 *     <width|height> <comparisonOperator> <length><lengthUnit>
 *
 *     e.g. width <= 200px
 *
 * ### Situation four - double range syntax
 *
 *     <length><lengthUnit> <comparisonOperator> <width|height> <comparisonOperator2> <length2><lengthUnit2>
 *
 *     e.g. 0 <= width <= 200px
 *
 * Note that more exotic syntax (e.g. `calc()` functions, ratios) are not currently
 * supported. They will be returned without being parsed, and might be sorted in a
 * still-deterministic but slightly odd manner.
 *
 * @param params The original media query, as a string
 * @returns The extracted and parsed breakpoints from the media query
 */
export const parseAtRule = (params: string): ParsedAtRule[] => {
  // Inspired by previous work from
  // https://github.com/OlehDutchenko/sort-css-media-queries/blob/master/lib/create-sort.js

  const parsedMatches: ParsedAtRule[] = [];

  const situations: Situations = [
    // Situation one - min/max syntax
    {
      regex: property.source + colon.source + length_.source,
      parser: parseMinMaxSyntax,
    },

    // Situation two - reversed range syntax
    {
      regex: length_.source + comparisonOperators.source + property.source,
      parser: parseReversedRangeSyntax,
    },

    // Situation three - range syntax
    {
      regex: property.source + comparisonOperators.source + length_.source,
      parser: parseRangeSyntax,
    },

    // Situation four - double range syntax
    {
      regex:
        length_.source +
        comparisonOperators.source +
        property.source +
        comparisonOperators2.source +
        length2.source,
      parser: parseDoubleRangeSyntax,
    },
  ];

  for (const { regex, parser } of situations) {
    const matches = [...params.matchAll(new RegExp(regex, 'g'))];
    for (const match of matches) {
      const parsedMatch = parser(match);
      if (parsedMatch) {
        parsedMatches.push(parsedMatch);
      }
    }
  }

  // Ensure that the order of the media features within an at-rule / media query are preserved.
  //
  // For example, if we have
  //
  //     @media (width > 400px) or (width < 200px)
  //
  // We want to make sure that `parsedMatches` returns something equivalent to
  // `['width > 400px', 'width < 200px']`, not `['width < 200px', 'width > 400px']`.
  //
  // This is important as the order of the array elements will affect the result of
  // sorting stages after this.
  parsedMatches.sort((a, b) => {
    return a.index - b.index;
  });

  return parsedMatches;
};
