import { memo } from 'react';

import { analyzeCssInDev } from './dev-warnings';
import { isNodeEnvironment } from './is-node';
import insertRule, { getStyleBucketName } from './sheet';
import { useCache } from './style-cache';
import type { StyleSheetOpts } from './types';

interface StyleProps extends StyleSheetOpts {
  /**
   * CSS Rules.
   * Ensure each rule is a separate element in the array.
   */
  children: string[];
}

function Style(props: StyleProps): JSX.Element | null {
  const inserted = useCache();

  if (process.env.NODE_ENV === 'development') {
    props.children.forEach(analyzeCssInDev);
  }

  if (props.children.length) {
    if (isNodeEnvironment()) {
      for (let i = 0; i < props.children.length; i++) {
        const sheet = props.children[i];
        if (inserted[sheet]) {
          continue;
        } else {
          inserted[sheet] = true;
        }

        const bucketName = getStyleBucketName(sheet);
        // @ts-ignore
        globalThis.compiledServerBuckets[bucketName].add(sheet);
      }
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

export default memo(Style);
