import { StyleSheetOpts } from './types';
import { Bucket, buckets, getCompiledAttr } from './buckets';
import { appendCSSTextNode, createStyleElement } from './css-utils';

export const bucketsCache: Partial<{ [bucket in Bucket]: HTMLStyleElement }> = {};
const bucketsAddedToHead: Partial<{ [bucket in Bucket]: boolean }> = {};
let isBucketsCacheFilled = false;

export function addBucketToHead(bucket: Bucket) {
  if (!bucketsAddedToHead[bucket]) {
    const bucketIndex = buckets.indexOf(bucket);
    let nextBucketFromCache = null;

    // Find next bucket before which we will add our current bucket element
    for (let i = bucketIndex + 1; i < buckets.length; i++) {
      nextBucketFromCache = bucketsCache[buckets[i]] as HTMLStyleElement;

      if (document.head.contains(nextBucketFromCache)) {
        break;
      }

      nextBucketFromCache = null;
    }

    document.head.insertBefore(bucketsCache[bucket] as HTMLStyleElement, nextBucketFromCache);

    bucketsAddedToHead[bucket] = true;
  }
}

function traverseStyleTextNode(
  styleNode: HTMLStyleElement,
  styleElement: HTMLStyleElement,
  inserted: Record<string, true>
) {
  let styleNodeChild = styleNode.firstChild;

  while (styleNodeChild) {
    const css = styleNodeChild.textContent?.trim();

    if (css && !inserted[css]) {
      inserted[css] = true;

      appendCSSTextNode(styleElement, css);
    }

    styleNodeChild = styleNodeChild.nextSibling;
  }
}

export default function createBucketSheetsCache(
  opts: StyleSheetOpts,
  inserted: Record<string, true>
) {
  if (!isBucketsCacheFilled) {
    buckets.forEach((bucket) => {
      const styleElement = createStyleElement(opts, bucket);

      // Remove style tags injected by ssr and append their css text node into
      // bucket cache element and mark each css text node as inserted
      document.body
        .querySelectorAll<HTMLStyleElement>(`style[${getCompiledAttr(bucket)}]`)
        .forEach((styleNode) => {
          traverseStyleTextNode(styleNode, styleElement, inserted);

          styleNode.remove();
        });

      bucketsCache[bucket] = styleElement;
    });

    isBucketsCacheFilled = true;
  }
}
