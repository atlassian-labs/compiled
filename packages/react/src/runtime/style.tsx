import React from 'react';

import { analyzeCssInDev } from './dev-warnings.js';
import { isServerEnvironment } from './is-server-environment.js';
import insertRule, { getStyleBucketName, styleBucketOrdering } from './sheet.js';
import { useCache } from './style-cache.js';
import { StyleContainerProvider, useStyleContainer } from './style-container.js';
import type { Bucket, StyleSheetOpts } from './types.js';

export { StyleContainerProvider };
export type { StyleContainerConfig } from './style-container.js';

interface StyleProps extends StyleSheetOpts {
  /**
   * CSS Rules.
   * Ensure each rule is a separate element in the array.
   */
  children: string[];
}

export default function Style(props: StyleProps): JSX.Element | null {
  const inserted = useCache();
  const styleContainer = useStyleContainer();

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
      const opts: StyleSheetOpts = styleContainer
        ? { ...props, container: styleContainer.container, cacheKey: styleContainer.cacheKey }
        : props;

      for (let i = 0; i < props.children.length; i++) {
        const sheet = props.children[i];
        // When a container is active, namespace the cache key so this container's
        // inserted records are tracked independently from the main document cache.
        const cacheKey = styleContainer ? `${styleContainer.cacheKey}:${sheet}` : sheet;
        if (inserted[cacheKey]) {
          continue;
        }

        inserted[cacheKey] = true;
        insertRule(sheet, opts);
      }
    }
  }

  return null;
}
