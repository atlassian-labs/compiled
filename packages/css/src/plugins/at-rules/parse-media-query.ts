import { parseMinMaxSyntax, parseRangeSyntax, parseReversedRangeSyntax } from './parsers';
import type { ParsedAtRule, Situations } from './types';

const comparisonOperators = /(?<operator>(?:<=?)|(?:>=?)|=)\s*/;
// Matches min-width, min-height, max-width, max-height,
// min-device-width, min-device-height, max-device-width, max-device-height,
// width, height, device-width, and device-height.
const property = /(?:(?<property>((?:min|max)-)?(?:device-)?(?:width|height))\s*)/;
const colon = /(?<colon>:\s*)/;

const length_ = /(?<length>-?\d*\.?\d+)(?<lengthUnit>ch|em|ex|px|rem)?\s*/;

/**
 * Extracts and parses breakpoint information from a media query. We define breakpoints as
 * the `min-width`/`max-width`/`min-height`/`max-width`/`width`/`height` parts of a media query.
 *
 * There are three situations that this function can handle (terminology is based on
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
 * Cases like 0 <= width <= 200px are treated as combinations of
 * situation two and situation three.
 *
 * Note that more exotic syntax (e.g. `calc()` functions, ratios) are not currently
 * supported. They will be returned without being parsed, and might be sorted in a
 * still-deterministic but slightly odd manner.
 *
 * @param params The original media query, as a string
 * @returns The extracted and parsed breakpoints from the media query
 */
export const parseMediaQuery = (params: string): ParsedAtRule[] => {
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

  // Ensure that the order of the media features within an at-rule / media query are preserved. The above `for` loop checks for matches for each of
  // the three situations / syntaxes sequentially. This may result in
  // situations where one part of the media query erroneously appears after
  // another in `parsedMatches`. For example:
  //
  //     @media (0 <= width) and (200px >= height) or (min-width: 300px)
  //
  // Without the extra sort() step, `parsedMatches` would be something
  // equivalent to
  //
  //     ['min-width: 300px', '0 <= width', '200px >= height']
  //
  // when the correct order should be
  //
  //     ['0 <= width', '200px >= height', 'min-width: 300px']
  //
  // This is important as the order of the array elements will affect the
  // result of sorting stages after this.
  parsedMatches.sort((a, b) => {
    return a.index - b.index;
  });

  return parsedMatches;
};
