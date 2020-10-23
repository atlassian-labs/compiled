import { StyleSheetOpts, Bucket } from './types';

/**
 * Ordered buckets.
 */
export const buckets: Bucket[] = ['', 'l', 'v', 'fw', 'f', 'fv', 'h', 'a', 'm'];

const bucketsCache: Partial<Record<Bucket, HTMLStyleElement>> = {};
const bucketsAddedToHead: Partial<Record<Bucket, boolean>> = {};

// NOTE: If we are adding/removing anything from this list, Please also update the
// the list in css package. Going forward we might move this common
// variable in separate package.
const pseudosMap: { [key: string]: Exclude<Bucket, '' | 'm'> } = {
  link: 'l',
  visited: 'v',
  'focus-within': 'fw',
  focus: 'f',
  'focus-visible': 'fv',
  hover: 'h',
  active: 'a',
};

/**
 * Add buckets to `document.head`. Checks for next bucket which is already added
 * to head and insert current bucket before that. And finally mark added bucket
 * so it won't get added again.
 *
 * @param bucket Current Bucket which we want to insert in head
 */
function addBucketToHead(bucket: Bucket) {
  if (!bucketsAddedToHead[bucket]) {
    const bucketIndex = buckets.indexOf(bucket);
    let nextBucketFromCache = null;

    // Find next bucket before which we will add our current bucket element
    for (let i = bucketIndex + 1; i < buckets.length; i++) {
      const nextBucket = buckets[i];

      if (bucketsAddedToHead[nextBucket]) {
        nextBucketFromCache = bucketsCache[nextBucket]!;

        break;
      }
    }

    document.head.insertBefore(bucketsCache[bucket]!, nextBucketFromCache);

    bucketsAddedToHead[bucket] = true;
  }
}

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
 * Used to prevent re-creating the bucket sheets cache during browser runtime.
 */
let isBucketsCacheFilled = false;

/**
 * Create in memory buckets cache on browser. We will add sheets to these
 * buckets and add that bucket to head.
 *
 * @param opts StyleSheetOpts
 */
function createBucketSheetsCache(opts: StyleSheetOpts) {
  if (!isBucketsCacheFilled) {
    buckets.forEach((bucket) => {
      bucketsCache[bucket] = createStyleElement(opts);
    });

    isBucketsCacheFilled = true;
  }
}

/**
 * Gets the bucket depending on the sheet.
 *
 * For eg.
 * `getBucket('._a1234567:hover{ color: red; }')` will return `h` - the hover bucket.
 *
 * @param sheet styles for which we are getting the bucket
 */
const getBucket = (sheet: string): Bucket => {
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
export const groupSheetsByBucket = <T extends string, U extends T[]>(sheets: U) => {
  return sheets.reduce<Record<Bucket, T[]>>((accum, sheet) => {
    const bucket = getBucket(sheet);
    const bucketValue = accum[bucket];

    accum[bucket] = bucketValue ? bucketValue.concat(sheet) : [sheet];

    return accum;
  }, {} as Record<Bucket, T[]>);
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

  // Creating in memory buckets. This will run only once.
  createBucketSheetsCache(opts);

  return (css: string) => {
    // Get the bucket based on css sheet
    const bucket = getBucket(css);
    const style = bucketsCache[bucket]!;

    // Add that bucket to head using bucket cache style element
    addBucketToHead(bucket);

    if (speedy) {
      const sheet = style.sheet as CSSStyleSheet;
      sheet.insertRule(css, sheet.cssRules.length);
    } else {
      style.appendChild(document.createTextNode(css));
    }
  };
}
