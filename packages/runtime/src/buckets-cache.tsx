import { StyleSheetOpts, Bucket } from './types';
import { buckets } from './buckets-utils';
import { createStyleElement } from './css-utils';

export const bucketsCache: Partial<Record<Bucket, HTMLStyleElement>> = {};
const bucketsAddedToHead: Partial<Record<Bucket, boolean>> = {};
let isBucketsCacheFilled = false;

/**
 * Add buckets to `document.head`. Checks for next bucket which is already added
 * to head and insert current bucket before that. And finally mark added bucket
 * so it won't get added again.
 *
 * @param bucket Current Bucket which we want to insert in head
 */
export function addBucketToHead(bucket: Bucket) {
  if (!bucketsAddedToHead[bucket]) {
    const bucketIndex = buckets.indexOf(bucket);
    let nextBucketFromCache = null;

    // Find next bucket before which we will add our current bucket element
    for (let i = bucketIndex + 1; i < buckets.length; i++) {
      const nextBucket = buckets[i];

      if (bucketsAddedToHead[nextBucket]) {
        nextBucketFromCache = bucketsCache[nextBucket] as HTMLStyleElement;

        break;
      }
    }

    document.head.insertBefore(bucketsCache[bucket] as HTMLStyleElement, nextBucketFromCache);

    bucketsAddedToHead[bucket] = true;
  }
}

/**
 * Create in memory buckets cache on browser. We will add sheets to these
 * buckets and add that bucket to head.
 *
 * @param opts StyleSheetOpts
 */
export default function createBucketSheetsCache(opts: StyleSheetOpts) {
  if (!isBucketsCacheFilled) {
    buckets.forEach((bucket) => {
      bucketsCache[bucket] = createStyleElement(opts, bucket);
    });

    isBucketsCacheFilled = true;
  }
}
