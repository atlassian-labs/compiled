export interface AfterInterpolation {
  css: string;
  variableSuffix: string;
}

export interface BeforeInterpolation {
  css: string;
  variablePrefix: string;
}

/**
 * Will return any suffix out of the CSS and return them both.
 *
 * E.g. `'px;font-size: 20px;'` would return `"px"` as the suffix and `";font-size: 20px;"` as the CSS.
 *
 * @param css all the CSS after the interpolation
 */
export const cssAfterInterpolation = (css: string): AfterInterpolation => {
  let variableSuffix = '';

  if (css.includes('(') || css[0] === ' ' || css[0] === '\n' || css[0] === ';' || css[0] === ',') {
    css = css;
  } else {
    let cssIndex;
    // when calc property used, we get ')' along with unit in the 'literal' object
    // Eg. `marginLeft: calc(100% - ${obj.key}rem)` will give ')rem' in the span literal
    if (css.indexOf(')') !== -1) {
      cssIndex = css.indexOf(')');
    } else if (css.indexOf(';') !== -1) {
      cssIndex = css.indexOf(';');
    } else if (css.indexOf(',') !== -1) {
      cssIndex = css.indexOf(',');
    } else if (css.indexOf('\n') !== -1) {
      cssIndex = css.indexOf('\n');
    } else if (css.indexOf(' ') !== -1) {
      cssIndex = css.indexOf(' ');
    } else {
      cssIndex = css.length;
    }

    variableSuffix = css.slice(0, cssIndex);
    css = css.slice(cssIndex);
  }

  return {
    variableSuffix,
    css,
  };
};

/**
 * Will extract any prefix out of the CSS and return them both.
 *
 * @param css all the CSS before the interpolation
 */
export const cssBeforeInterpolation = (css: string): BeforeInterpolation => {
  const trimCss = css.trim();
  if (
    trimCss[trimCss.length - 1] === '(' ||
    trimCss[0] === ',' ||
    trimCss[trimCss.length - 1] === ',' ||
    css[css.length - 1] === ' '
  ) {
    // We are inside a css like "translateX(".
    // There is no prefix we need to extract here.
    return {
      css: css,
      variablePrefix: '',
    };
  }

  if (!css.match(/:|;/) && !css.includes('(')) {
    return {
      variablePrefix: css,
      css: '',
    };
  }

  let variablePrefix = css.match(/:(.+$)/)?.[1] || '';
  if (variablePrefix) {
    variablePrefix = variablePrefix.trim();
    const lastIndex = css.lastIndexOf(variablePrefix);
    css = css.slice(0, lastIndex);
  }

  return {
    css,
    variablePrefix,
  };
};
