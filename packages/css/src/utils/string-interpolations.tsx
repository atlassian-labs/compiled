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
 * Will remove any suffix out of the CSS and return them both.
 *
 * E.g. `'px;font-size: 20px;'` would return `"px"` as the suffix and `";font-size: 20px;"` as the CSS.
 *
 * @param css all the CSS after the interpolation
 */
export const cssAfterInterpolation = (css: string): AfterInterpolation => {
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
 * Will extract any prefix out of the CSS and return them both.
 *
 * @param css all the CSS before the interpolation
 */
export const cssBeforeInterpolation = (css: string): BeforeInterpolation => {
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
