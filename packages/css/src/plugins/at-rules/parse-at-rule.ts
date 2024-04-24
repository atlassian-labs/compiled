import {
  parseSituationFour,
  parseSituationOne,
  parseSituationThree,
  parseSituationTwo,
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
 * There are four situations that this function can handle:
 *
 * ### Situation one
 *
 *     <property>: <length><lengthUnit>
 *
 *     e.g. max-width: 200px
 *
 * ### Situation two
 *
 *     <length><lengthUnit> <comparisonOperator> <width|height>
 *
 *     e.g. 200px >= width
 *
 * ### Situation three
 *
 *     <width|height> <comparisonOperator> <length><lengthUnit>
 *
 *     e.g. width <= 200px
 *
 * ### Situation four
 *
 *     <length><lengthUnit> <comparisonOperator> <width|height> <comparisonOperator2> <length2><lengthUnit2>
 *
 *     e.g. 0 <= width <= 200px
 *
 * Note that more exotic syntax (e.g. `calc()` functions, ratios) are not currently
 * supported.
 *
 * They will either be returned without being parsed, or throw an error.
 *
 * @param params The original media query, as a string
 * @returns The extracted and parsed breakpoints from the media query
 */
export const parseAtRule = (params: string): ParsedAtRule[] => {
  // Inspired by previous work from
  // https://github.com/OlehDutchenko/sort-css-media-queries/blob/master/lib/create-sort.js

  const parsedMatches: ParsedAtRule[] = [];

  const situations: Situations = [
    // Situation one
    {
      regex: property.source + colon.source + length_.source,
      parser: parseSituationOne,
    },

    // Situation two
    {
      regex: length_.source + comparisonOperators.source + property.source,
      parser: parseSituationTwo,
    },

    // Situation three
    {
      regex: property.source + comparisonOperators.source + length_.source,
      parser: parseSituationThree,
    },

    // Situation four
    {
      regex:
        length_.source +
        comparisonOperators.source +
        property.source +
        comparisonOperators2.source +
        length2.source,
      parser: parseSituationFour,
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

  // Sort matches from first to last, as they appear in the at-rule / media query
  parsedMatches.sort((a, b) => {
    return a.index - b.index;
  });

  return parsedMatches;
};
