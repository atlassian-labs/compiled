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
        <>
          <style data-cmpld nonce={props.nonce}>
            {styleBucketOrdering.map((bucket) => bucketedSheets[bucket]).join('')}
          </style>
          <script
            data-cmpld-cache
            dangerouslySetInnerHTML={{ __html: JSON.stringify(inserted) }}></script>
        </>
      );
    } else {
      for (let i = 0; i < props.children.length; i++) {
        const sheet = props.children[i];

        if (!inserted[sheet]) {
          inserted[sheet] = true;
          insertRule(sheet, props);
        }
      }
    }
  }

  return null;
}
