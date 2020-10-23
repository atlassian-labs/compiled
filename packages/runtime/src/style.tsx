import React from 'react';
import createStyleSheet, { groupByBucket, buckets } from './sheet';
import { analyzeCssInDev } from './dev-warnings';
import { StyleSheetOpts } from './types';
import { useCache } from './provider';
import { isNodeEnvironment } from './is-node';

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
  const inserted = useCache();

  if (process.env.NODE_ENV === 'development') {
    props.children.forEach(analyzeCssInDev);
  }

  const sheets = props.children.filter((sheet) => {
    if (inserted[sheet]) {
      return false;
    }

    inserted[sheet] = true;

    return true;
  });

  if (sheets.length) {
    if (isNodeEnvironment()) {
      const sheetsGroupedByBucket = groupByBucket(sheets);

      return (
        <style nonce={props.nonce}>
          {buckets
            .filter((bucket) => !!sheetsGroupedByBucket[bucket])
            .map((bucket) => sheetsGroupedByBucket[bucket])}
        </style>
      );
    } else {
      // Keep re-assigning over ternary because it's smaller
      stylesheet = stylesheet || createStyleSheet(props);
      sheets.forEach(stylesheet);
    }
  }

  return null;
}
