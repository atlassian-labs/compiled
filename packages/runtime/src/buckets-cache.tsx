import { StyleSheetOpts } from './types';
import { Bucket, buckets } from './buckets-utils';
import { createStyleElement } from './css-utils';

export const bucketsCache: Partial<Record<Bucket, HTMLStyleElement>> = {};
const bucketsAddedToHead: Partial<Record<Bucket, boolean>> = {};
let isBucketsCacheFilled = false;

export function addBucketToHead(bucket: Bucket) {
  if (!bucketsAddedToHead[bucket]) {
    const bucketIndex = buckets.indexOf(bucket);
    let nextBucketFromCache = null;

    // Find next bucket before which we will add our current bucket element
    for (let i = bucketIndex + 1; i < buckets.length; i++) {
      const nextBucket = buckets[i];

      nextBucketFromCache = bucketsCache[nextBucket] as HTMLStyleElement;

      if (bucketsAddedToHead[nextBucket]) {
        break;
      }

      nextBucketFromCache = null;
    }

    document.head.insertBefore(bucketsCache[bucket] as HTMLStyleElement, nextBucketFromCache);

    bucketsAddedToHead[bucket] = true;
  }
}

export default function createBucketSheetsCache(opts: StyleSheetOpts) {
  if (!isBucketsCacheFilled) {
    buckets.forEach((bucket) => {
      bucketsCache[bucket] = createStyleElement(opts, bucket);
    });

    isBucketsCacheFilled = true;
  }
}
