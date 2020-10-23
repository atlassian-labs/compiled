import { StyleSheetOpts, Bucket } from './types';

/**
 * Ordered style buckets using their short psuedo name.
 * If changes are needed make sure that it aligns with the definition in `sort-at-rule-pseudos.tsx`.
 */
export const buckets: Bucket[] = ['', 'l', 'v', 'fw', 'f', 'fv', 'h', 'a', 'm'];

/**
 * Holds all style buckets in memory that have been added to the head.
 */
const styleBucketsInHead: Partial<Record<Bucket, HTMLStyleElement>> = {};

/**
 * Maps the long pseudo name to the short pseudo name.
 * Pseudos that match here will be ordered,
 * everythin else will make their way to the catch all style bucket.
 */
const pseudosMap: Record<string, Bucket | undefined> = {
  link: 'l',
  visited: 'v',
  'focus-within': 'fw',
  focus: 'f',
  'focus-visible': 'fv',
  hover: 'h',
  active: 'a',
};

/**
 * Create style element and add attributes to it
 *
 * @param opts StyleSheetOpts
 * @param bucket Bucket
 */
function createStyleElement(opts: StyleSheetOpts): HTMLStyleElement {
  const tag = document.createElement('style');
  opts.nonce && tag.setAttribute('nonce', opts.nonce);
  tag.appendChild(document.createTextNode(''));
  return tag;
}

/**
 * Lazily adds a `<style>` bucket to the `<head>`.
 * This will ensure that the style buckets are ordered.
 *
 * @param bucket Bucket to insert in the head.
 */
function lazyAddStyleBucketToHead(bucketName: Bucket, opts: StyleSheetOpts): HTMLStyleElement {
  if (!styleBucketsInHead[bucketName]) {
    const nextBucketIndex = buckets.indexOf(bucketName) + 1;
    let nextBucketFromCache = null;

    // Find next bucket before which we will add our current bucket element
    for (let i = nextBucketIndex; i < buckets.length; i++) {
      const nextBucketName = buckets[i];

      if (styleBucketsInHead[nextBucketName]) {
        nextBucketFromCache = styleBucketsInHead[nextBucketName]!;
        break;
      }
    }

    styleBucketsInHead[bucketName] = createStyleElement(opts);
    document.head.insertBefore(styleBucketsInHead[bucketName]!, nextBucketFromCache);
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
const getStyleBucketName = (sheet: string): Bucket => {
  // We are grouping all the at-rules like @media, @supports etc under `m` bucket.
  if (sheet.charCodeAt(0) === 64 /* "@" */) {
    return 'm';
  }

  /**
   * We assume that classname will always be 9 character long,
   * using this the 10th character could be a pseudo declaration.
   */
  if (sheet.charCodeAt(10) === 58 /* ":" */) {
    const openBracketIndex = sheet.indexOf('{');
    const name = sheet.slice(11, openBracketIndex);
    // Return a mapped pseudo else the default catch all bucket.
    return pseudosMap[name] || '';
  }

  // Return default catch all bucket
  return '';
};

/**
 * Group sheets by bucket.
 *
 * @returns { 'h': ['._a1234567:hover{ color: red; }', '._a1234567:hover{ color: green; }'] }
 * @param sheets styles which are grouping under bucket
 */
export const groupSheetsByBucket = (sheets: string[]) => {
  return sheets.reduce<Record<Bucket, string[]>>((accum, sheet) => {
    const bucketName = getStyleBucketName(sheet);
    accum[bucketName] = accum[bucketName] || [];
    accum[bucketName].push(sheet);
    return accum;
  }, {} as Record<Bucket, string[]>);
};

/**
 * Returns a style sheet object that is used to move styles to the head of the application
 * during runtime.
 *
 * @param opts StyleSheetOpts
 * @param inserted Singleton cache for tracking what styles have already been added to the head
 */
export default function createStyleSheet(opts: StyleSheetOpts) {
  const speedy = process.env.NODE_ENV === 'production';

  return (css: string) => {
    const bucketName = getStyleBucketName(css);
    const style = lazyAddStyleBucketToHead(bucketName, opts);

    if (speedy) {
      const sheet = style.sheet as CSSStyleSheet;
      sheet.insertRule(css, sheet.cssRules.length);
    } else {
      style.appendChild(document.createTextNode(css));
    }
  };
}
