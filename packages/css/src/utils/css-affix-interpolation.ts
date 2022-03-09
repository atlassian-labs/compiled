import { units } from './css-property';

export interface AfterInterpolation {
  css: string;
  variableSuffix: string;
}

export interface BeforeInterpolation {
  css: string;
  variablePrefix: string;
}

/**
 * Will remove any valid suffix out of the CSS and return them both.
 * Handles both terminated and un-terminated CSS.
 *
 * @param css all the CSS after the interpolation
 */
const cssAfterInterpolation = (css: string): AfterInterpolation => {
  const regex = new RegExp(`^(${units.join('|')}|"|')(;|,|\n| |\\))?`);
  const result = regex.exec(css);

  if (result) {
    return {
      variableSuffix: result[1],
      css: css.replace(result[1], ''),
    };
  }

  return {
    variableSuffix: '',
    css,
  };
};

/**
 * Will extract any valid prefix out of the CSS and return them both.
 * Handles both CSS with and without a property key.
 *
 * @param css all the CSS before the interpolation
 */
const cssBeforeInterpolation = (css: string): BeforeInterpolation => {
  const lastCharacter = css[css.length - 1];

  if (['"', "'", '-'].includes(lastCharacter)) {
    return {
      variablePrefix: lastCharacter,
      css: css.slice(0, -1),
    };
  }

  return {
    variablePrefix: '',
    css,
  };
};

/**
 * Extracts both prefix and suffix for CSS.
 *
 * This also handles the `url()` special case as interpolation does not work for this function.
 *
 * Prefix examples:
 * - `'"'` would return `'"'` as the suffix and `''` as the CSS.
 * - `'font-size: -` would return `'-'` as the suffix and `'font-size: '` as the CSS.
 * - `'color: blue'` would return `''` as the suffix and `'color: blue'` as the CSS.
 *
 * Suffix examples:
 * - `'px;font-size: 20px;'` would return `"px"` as the suffix and `";font-size: 20px;"` as the CSS.
 * - `'"'` would return `'"'` as the suffix and `''` as the CSS.
 * - `'notasuffix;'` would return `''` as the suffix and `'notasuffix;'` as the CSS.
 *
 *
 * @param before all the CSS _before_ the interpolation
 * @param after all the CSS _after_ the interpolation
 */
export const cssAffixInterpolation = (
  before: string,
  after: string
): [BeforeInterpolation, AfterInterpolation] => {
  if (before.endsWith('url(') && after.startsWith(')')) {
    // Interpolation does not work for `url()` per https://stackoverflow.com/a/42331003
    // Workaround by handling this case explicitly, as we want to interpolate other functions
    return [
      { variablePrefix: 'url(', css: before.slice(0, -'url('.length) },
      { variableSuffix: ')', css: after.slice(')'.length) },
    ];
  }
  return [cssBeforeInterpolation(before), cssAfterInterpolation(after)];
};
