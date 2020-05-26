/**
 * This module is kind of a mess.
 * Let's get it working first and then fix it up later.
 * There must be a better way than what we're doing, just needs some thought first.
 */

export interface AfterInterpolation {
  css: string;
  variableSuffix?: string;
}

/**
 * Extracts a suffix from a css property e.g:
 * 'px;font-size: 20px; would return "px" as the suffix and ";font-size: 20px;" as rest.
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

export interface BeforeInterpolation {
  css: string;
  variablePrefix?: string;
}

export const cssBeforeInterpolation = (css: string): BeforeInterpolation => {
  const trimCss = css.trim();
  if (
    trimCss[trimCss.length - 1] === '(' ||
    trimCss[0] === ',' ||
    trimCss[trimCss.length - 1] === ','
  ) {
    // We are inside a css like "translateX(".
    // There is no prefix we need to extract here.
    return {
      css: css,
      variablePrefix: undefined,
    };
  }

  if (!css.match(/:|;/) && !css.includes('(')) {
    return {
      variablePrefix: css,
      css: '',
    };
  }

  let variablePrefix = css.match(/:(.+$)/)?.[1];
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

export const inline = (str?: string) => (str ? str : '');
