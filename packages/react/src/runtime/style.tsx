import React from 'react';
import insertRule, { getStyleBucketName, styleBucketOrdering } from './sheet';
import { analyzeCssInDev } from './dev-warnings';
import { StyleSheetOpts, Bucket } from './types';
import { useCache } from './style-cache';
import { isNodeEnvironment } from './is-node';

interface StyleProps extends StyleSheetOpts {
  /**
   * CSS Rules.
   * Ensure each rule is a separate element in the array.
   */
  children: string[];
}

export default function Style(props: StyleProps): JSX.Element | null {
  const inserted = useCache();

  if (process.env.NODE_ENV === 'development') {
    props.children.forEach(analyzeCssInDev);
  }

  if (props.children.length) {
    if (isNodeEnvironment()) {
      const bucketedSheets: Partial<Record<Bucket, string>> = {};
      let hasSheets = false;

      for (let i = 0; i < props.children.length; i++) {
        const sheet = props.children[i];
        if (inserted[sheet]) {
          continue;
        } else {
          inserted[sheet] = true;
          hasSheets = true;
        }

        const bucketName = getStyleBucketName(sheet);
        bucketedSheets[bucketName] = (bucketedSheets[bucketName] || '') + sheet;
      }

      if (!hasSheets) {
        return null;
      }

      return (
        // set data-cmpld attribute to "s" for SSR
        <style data-cmpld="s" nonce={props.nonce}>
          {styleBucketOrdering.map((bucket) => bucketedSheets[bucket]).join('')}
        </style>
      );
    } else {
      for (let i = 0; i < props.children.length; i++) {
        const sheet = props.children[i];
        if (inserted[sheet]) {
          continue;
        }

        inserted[sheet] = true;
        insertRule(sheet, props);
      }
    }
  }

  return null;
}
