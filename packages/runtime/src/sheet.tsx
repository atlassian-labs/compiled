/**
 * Mostly ripped out of Emotion https://github.com/emotion-js/emotion and then heavily modified to be even smaller.
 * Thanks everyone who contributed in some form or another.
 */
import { StyleSheetOpts } from './types';
import { getBucket } from './buckets';
import createBucketSheetsCache, { bucketsCache, addBucketToHead } from './buckets-cache';
import { getStyleElementSheet, appendCSSTextNode } from './css-utils';

/**
 * Returns a style sheet object that is used to move styles to the head of the application
 * during runtime.
 *
 * @param opts StyleSheetOpts
 * @param inserted Singleton cache for tracking what styles have already been added to the head
 */
export default function createStyleSheet(opts: StyleSheetOpts) {
  const speedy = process.env.NODE_ENV === 'production';

  createBucketSheetsCache(opts);

  return (css: string) => {
    const bucket = getBucket(css);

    addBucketToHead(bucket);

    if (speedy) {
      const sheet = getStyleElementSheet(bucketsCache[bucket]);
      // this is the ultrafast version, works across browsers
      // the big drawback is that the css won't be editable in devtools in most browsers.
      sheet.insertRule(css, sheet.cssRules.length);
    } else {
      appendCSSTextNode(bucketsCache[bucket], css);
    }
  };
}
