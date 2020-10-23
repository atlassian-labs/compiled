import { StyleSheetOpts, Bucket } from './types';

/**
 * Ordered style buckets using the short psuedo name.
 * If changes are needed make sure that it aligns with the definition in `sort-at-rule-pseudos.tsx`.
 */
export const buckets: Bucket[] = ['', 'l', 'v', 'fw', 'f', 'fv', 'h', 'a', 'm'];

/**
 * Holds all style buckets in memory that have been added to the head.
 */
const bucketsCache: Partial<Record<Bucket, HTMLStyleElement>> = {};

/**
 * Maps the long pseudo name to the short pseudo name.
 */
const pseudosMap: Record<string, Bucket> = {
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
 * This will ensure that the style buckets are ordered correctly.
 *
 * @param bucket Bucket to insert in the head.
 */
function lazyAddStyleBucketToHead(bucket: Bucket, opts: StyleSheetOpts): HTMLStyleElement {
  if (!bucketsCache[bucket]) {
    const bucketIndex = buckets.indexOf(bucket);
    let nextBucketFromCache = null;

    // Find next bucket before which we will add our current bucket element
    for (let i = bucketIndex + 1; i < buckets.length; i++) {
      const nextBucketName = buckets[i];

      if (bucketsCache[nextBucketName]) {
        nextBucketFromCache = bucketsCache[nextBucketName]!;
        break;
      }
    }

    bucketsCache[bucket] = createStyleElement(opts);
    document.head.insertBefore(bucketsCache[bucket]!, nextBucketFromCache);
  }

  return bucketsCache[bucket]!;
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
  // `64` corresponds to `@` i.e. at-rules. We are grouping all the at-rules
  // like @media, @supports etc under `m` bucket for now.
  if (sheet.charCodeAt(0) === 64) {
    return 'm';
  }

  // `58` corresponds to `:`. Here we are assuming that classname will always be
  // 9 character long. After getting pseudo class between `:` and `,` or `{`
  // we are returning its corresponding bucket
  if (sheet.charCodeAt(10) === 58) {
    const openBracketIndex = sheet.indexOf('{');
    const name = sheet.slice(11, openBracketIndex);
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
    const bucket = getStyleBucketName(sheet);
    const bucketValue = accum[bucket];

    accum[bucket] = bucketValue ? bucketValue.concat(sheet) : [sheet];

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
