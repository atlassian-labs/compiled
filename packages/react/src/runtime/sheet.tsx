import { isCacheDisabled } from './cache';
import type { Bucket, StyleSheetOpts } from './types';

/**
 * Ordered style buckets using their short psuedo name.
 * If changes are needed make sure that it aligns with the definition in `sort-at-rule-pseudos.tsx`.
 */
export const styleBucketOrdering: Bucket[] = [
  // catch-all
  '',
  // link
  'l',
  // visited
  'v',
  // focus-within
  'w',
  // focus
  'f',
  // focus-visible
  'i',
  // hover
  'h',
  // active
  'a',
  // at-rules
  'm',
];

/**
 * Holds all style buckets in memory that have been added to the head.
 */
const styleBucketsInHead: Partial<Record<Bucket, HTMLStyleElement>> = {};

/**
 * Maps the long pseudo name to the short pseudo name.
 * Pseudos that match here will be ordered,
 * everythin else will make their way to the catch all style bucket.
 * We reduce the pseduo name to save bundlesize.
 * Thankfully there aren't any overlaps, see: https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes.
 */
const pseudosMap: Record<string, Bucket | undefined> = {
  // link
  k: 'l',
  // visited
  ited: 'v',
  // focus-within
  'us-within': 'w',
  // focus
  us: 'f',
  // focus-visible
  'us-visible': 'i',
  // hover
  er: 'h',
  // active
  ive: 'a',
};

/**
 * Lazily adds a `<style>` bucket to the `<head>`.
 * This will ensure that the style buckets are ordered.
 *
 * @param bucket Bucket to insert in the head.
 */
function lazyAddStyleBucketToHead(bucketName: Bucket, opts: StyleSheetOpts): HTMLStyleElement {
  if (!styleBucketsInHead[bucketName]) {
    let currentBucketIndex = styleBucketOrdering.indexOf(bucketName) + 1;
    let nextBucketFromCache = null;

    // Find the next bucket which we will add our new style bucket before.
    for (; currentBucketIndex < styleBucketOrdering.length; currentBucketIndex++) {
      const nextBucket = styleBucketsInHead[styleBucketOrdering[currentBucketIndex]];
      if (nextBucket) {
        nextBucketFromCache = nextBucket;
        break;
      }
    }

    const tag = document.createElement('style');
    opts.nonce && tag.setAttribute('nonce', opts.nonce);
    tag.appendChild(document.createTextNode(''));
    document.head.insertBefore(tag, nextBucketFromCache);

    if (isCacheDisabled()) {
      return tag;
    }

    styleBucketsInHead[bucketName] = tag;
  }

  return styleBucketsInHead[bucketName]!;
}

/**
 * Gets the bucket depending on the sheet.
 * This function makes assumptions as to the form of the input class name.
 *
 * Input:
 *
 * ```
 * "._a1234567:hover{ color: red; }"
 * ```
 *
 * Output:
 *
 * ```
 * "h"
 * ```
 *
 * @param sheet styles for which we are getting the bucket
 */
export const getStyleBucketName = (sheet: string): Bucket => {
  // We are grouping all the at-rules like @media, @supports etc under `m` bucket.
  if (sheet.charCodeAt(0) === 64 /* "@" */) {
    return 'm';
  }

  /**
   * We assume that classname will always be 9 character long,
   * using this the 10th character could be a pseudo declaration.
   */
  if (sheet.charCodeAt(10) === 58 /* ":" */) {
    // We send through a subset of the string instead of the full pseudo name.
    // For example `"focus-visible"` name would instead of `"us-visible"`.
    // Return a mapped pseudo else the default catch all bucket.
    return pseudosMap[sheet.slice(14, sheet.indexOf('{'))] || '';
  }

  // Return default catch all bucket
  return '';
};

/**
 * Used to move styles to the head of the application during runtime.
 *
 * @param css string
 * @param opts StyleSheetOpts
 */
export default function insertRule(css: string, opts: StyleSheetOpts): void {
  const bucketName = getStyleBucketName(css);
  const style = lazyAddStyleBucketToHead(bucketName, opts);

  if (process.env.NODE_ENV === 'production') {
    const sheet = style.sheet as CSSStyleSheet;

    // Used to avoid unhandled exceptions across browsers with prefixed selectors such as -moz-placeholder.
    try {
      sheet.insertRule(css, sheet.cssRules.length);
    } catch {}
  } else {
    style.appendChild(document.createTextNode(css));
  }
}
