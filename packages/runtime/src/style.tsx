import React from 'react';
import createStyleSheet from './sheet';
import { analyzeCssInDev } from './dev-warnings';
import { StyleSheetOpts } from './types';
import { useCache } from './provider';
import { isNodeEnvironment } from './is-node';
import { buckets, getCompiledAttr, groupByBucket } from './buckets';

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

  const sheets = props.children;

  if (!sheets.length) {
    return null;
  }

  if (isNodeEnvironment()) {
    const filteredSheets = sheets.filter((sheet) => {
      if (inserted[sheet]) {
        return false;
      }

      inserted[sheet] = true;

      return true;
    });

    if (filteredSheets.length) {
      const rulesGroupedByBucket = groupByBucket(filteredSheets);

      return buckets
        .filter((bucket) => !!rulesGroupedByBucket[bucket])
        .map((bucket) => (
          <style key={bucket} {...{ [getCompiledAttr(bucket)]: '' }} nonce={props.nonce}>
            {rulesGroupedByBucket[bucket]}
          </style>
        ));
    }
  } else {
    // Keep re-assigning over ternary because it's smaller
    stylesheet = stylesheet || createStyleSheet(props, inserted);
    sheets.forEach(stylesheet);
  }

  return null;
}
