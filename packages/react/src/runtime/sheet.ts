import { isCacheDisabled } from './cache.js';
import { getShorthandDepth } from './shorthand.js';
import type { Bucket, StyleSheetOpts } from './types.js';

/**
 * Ordered style buckets using their short pseudo name.
 *
 * This is very bare-bones, with no support for nesting, like styles in
 * `@media` queries, pseudo-selectors mixed with shorthand properties, etc.
 *
 * If changes are needed to the pseudo-selectors, make sure that it aligns with the
 * definition in `packages/css/src/utils/style-ordering.ts`.
 */
export const styleBucketOrdering: Bucket[] = [
  // shorthand properties
  's-0',
  's-1',
  's-2',
  's-3',
  's-4',
  's-5',
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
 * everything else will make their way to the catch all style bucket.
 * We reduce the pseudo name to save bundlesize.
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
 * Holds style buckets per custom container (e.g. a ShadowRoot), keyed by the
 * container DOM node. Uses WeakMap so entries are garbage collected when the
 * container is removed from the page.
 */
const styleBucketsByContainer = new WeakMap<
  HTMLElement | ShadowRoot,
  Partial<Record<Bucket, HTMLStyleElement>>
>();

/**
 * Lazily adds a `<style>` bucket to a container, defaulting to `the `<head>`
 * when no container is provided in opts. Ensures style buckets are inserted in
 * the correct order regardless of the target container.
 *
 * Each custom container (e.g. a ShadowRoot) gets its own independent set of
 * buckets via the WeakMap — the main document singleton is unaffected.
 *
 * @param bucketName Bucket to insert into the container.
 * @param opts StyleSheetOpts optionally including a custom container.
 */
function lazyAddStyleBucketToContainer(bucketName: Bucket, opts: StyleSheetOpts): HTMLStyleElement {
  const target = opts.container ?? document.head;

  let buckets: Partial<Record<Bucket, HTMLStyleElement>>;
  if (opts.container) {
    if (!styleBucketsByContainer.has(opts.container)) {
      styleBucketsByContainer.set(opts.container, {});
    }
    buckets = styleBucketsByContainer.get(opts.container)!;
  } else {
    buckets = styleBucketsInHead;
  }

  if (!buckets[bucketName]) {
    let currentBucketIndex = styleBucketOrdering.indexOf(bucketName) + 1;
    let nextBucketFromCache: HTMLStyleElement | null = null;

    // Find the next bucket which we will add our new style bucket before.
    for (; currentBucketIndex < styleBucketOrdering.length; currentBucketIndex++) {
      const nextBucket = buckets[styleBucketOrdering[currentBucketIndex]];
      if (nextBucket) {
        nextBucketFromCache = nextBucket;
        break;
      }
    }

    const tag = document.createElement('style');
    opts.nonce && tag.setAttribute('nonce', opts.nonce);
    tag.appendChild(document.createTextNode(''));
    target.insertBefore(tag, nextBucketFromCache);

    if (isCacheDisabled()) {
      return tag;
    }

    buckets[bucketName] = tag;
  }

  return buckets[bucketName]!;
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

  const firstBracket = sheet.indexOf('{');

  /**
   * We assume that classname will always be 9 character long,
   * using this the 10th characters could be a pseudo declaration.
   */
  if (sheet.charCodeAt(10) === 58 /* ":" */) {
    // We send through a subset of the string instead of the full pseudo name.
    // For example `"focus-visible"` name would instead of `"us-visible"`.
    // Return a mapped pseudo else the default catch all bucket.
    const mapped = pseudosMap[sheet.slice(14, firstBracket)];
    if (mapped) return mapped;
  }

  const property = sheet.slice(firstBracket + 1, sheet.indexOf(':', firstBracket)).trim();

  const shorthandDepth = getShorthandDepth(property);
  if (typeof shorthandDepth === 'number') {
    return `s-${shorthandDepth}` as const;
  }

  // Return default catch all bucket
  return '';
};

/**
 * Used to move styles to the head of the application during runtime.
 * When `opts.container` is provided, styles are inserted into that container
 * instead of `document.head` — useful for Shadow DOM rendering.
 *
 * @param css string
 * @param opts StyleSheetOpts
 */
export default function insertRule(css: string, opts: StyleSheetOpts): void {
  const bucketName = getStyleBucketName(css);
  const style = lazyAddStyleBucketToContainer(bucketName, opts);

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
