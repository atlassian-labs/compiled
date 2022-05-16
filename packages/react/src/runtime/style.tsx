import React from 'react';

import { analyzeCssInDev } from './dev-warnings';
import { isServerEnvironment } from './is-server-environment';
import insertRule, { getStyleBucketName, styleBucketOrdering } from './sheet';
import { useCache } from './style-cache';
import type { Bucket, StyleSheetOpts } from './types';

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
    if (isServerEnvironment()) {
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
        <style
          data-cmpld
          nonce={props.nonce}
          dangerouslySetInnerHTML={{
            __html: styleBucketOrdering.map((bucket) => bucketedSheets[bucket]).join(''),
          }}
        />
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
