import * as React from 'react';
import { createStyleSheet } from './sheet';
import { analyzeCssInDev } from './dev-warnings';
import { StyleSheetOpts } from './types';

interface StyleProps extends StyleSheetOpts {
  /**
   * CSS Rules.
   * Ensure each rule is a separate element in the array.
   */
  children: string[];

  /**
   * Hash of the entire all css rules combined.
   * This is used to bypass the need of adding rules if it has already been done.
   */
  hash: string;
}

// Variable declaration list because it's smaller.
let stylesheet: ReturnType<typeof createStyleSheet>,
  // eslint-disable-next-line prefer-const
  inserted: Record<string, true> = {};

export default function Style(props: StyleProps) {
  const children = props.children;

  if (process.env.NODE_ENV === 'development') {
    analyzeCssInDev(children, props.hash);
  }

  // Reference self instead of window because it's smaller
  if (typeof self === 'undefined') {
    return <style nonce={props.nonce}>{children}</style>;
  }

  if (!inserted[props.hash] && children) {
    // Keep re-assigning over ternary because it's smaller
    stylesheet = stylesheet || createStyleSheet(props);
    children.forEach(stylesheet);
    inserted[props.hash] = true;
  }

  return null;
}
