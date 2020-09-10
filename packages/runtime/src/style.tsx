import React from 'react';
import { createStyleSheet } from './sheet';
import { analyzeCssInDev } from './dev-warnings';
import { StyleSheetOpts } from './types';
import { useCache } from './provider';

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
let stylesheet: ReturnType<typeof createStyleSheet>;

export default function Style(props: StyleProps) {
  const children = props.children;
  const inserted = useCache();

  if (process.env.NODE_ENV === 'development') {
    analyzeCssInDev(children, props.hash);
  }

  // TODO: We need to come up with a method to not insert styles if they have
  // been added before.

  // Will remove code on the client bundle.
  if (typeof window === 'undefined') {
    if (!props.hash || !inserted[props.hash]) {
      inserted[props.hash] = true;
      return <style nonce={props.nonce}>{children}</style>;
    }

    return null;
  }

  if (!props.hash || (!inserted[props.hash] && children)) {
    // Keep re-assigning over ternary because it's smaller
    stylesheet = stylesheet || createStyleSheet(props);
    children.forEach(stylesheet);
    inserted[props.hash] = true;
  }

  return null;
}
