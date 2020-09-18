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
}

// Variable declaration list because it's smaller.
let stylesheet: ReturnType<typeof createStyleSheet>;

export default function Style(props: StyleProps) {
  const children = props.children;
  const inserted = useCache();

  if (process.env.NODE_ENV === 'development') {
    children.forEach(analyzeCssInDev);
  }

  const sheetsToInsert = children.filter((sheet) => {
    if (inserted[sheet]) {
      return false;
    }

    inserted[sheet] = true;

    return true;
  });

  // Will remove code on the client bundle.
  if (sheetsToInsert.length) {
    if (typeof window === 'undefined') {
      return <style nonce={props.nonce}>{sheetsToInsert}</style>;
    } else {
      // Keep re-assigning over ternary because it's smaller
      stylesheet = stylesheet || createStyleSheet(props);
      sheetsToInsert.forEach(stylesheet);
    }
  }

  return null;
}
