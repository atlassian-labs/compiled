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
  // non-atomic `cssMapScoped` (`.cc-…`) rules — MUST live in a dedicated
  // `<style>` element (never shared with the atomic catch-all `''` bucket
  // or any other atomic bucket). In production, atomic rules are injected
  // via `sheet.insertRule()` (CSSOM-only, `textContent` stays empty).
  // Non-atomic rules are injected via `Text.appendData()` on the same node,
  // which — if it were the same element — would force the browser to reparse
  // the sheet from text and DISCARD every previously `insertRule`-inserted
  // rule (a full style wipe). Keeping `cc` in its own bucket guarantees the
  // two insertion strategies never target the same DOM node. Placed last so
  // `.cc-` rules cascade after all atomic rules (matches previous behaviour
  // where they were appended to the shared catch-all bucket).
  'cc',
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
 * Returns true when `characterCode` is a CSS selector delimiter that can appear
 * immediately after an atomic class name — i.e. a character that marks the end of
 * the class token. Covers the declaration block (`{`), pseudo (`:`), attribute
 * (`[`), class/id qualifiers (`.`/`#`), combinators (space/`>`/`+`/`~`), and the
 * selector-list separator (`,`). Operates on character codes (not substrings) to
 * stay allocation-free on the runtime hot path.
 */
const isClassBoundary = (characterCode: number): boolean =>
  characterCode === 58 /* ":" */ ||
  characterCode === 123 /* "{" */ ||
  characterCode === 91 /* "[" */ ||
  characterCode === 46 /* "." */ ||
  characterCode === 35 /* "#" */ ||
  characterCode === 32 /* " " */ ||
  characterCode === 62 /* ">" */ ||
  characterCode === 43 /* "+" */ ||
  characterCode === 126 /* "~" */ ||
  characterCode === 44; /* "," */

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
   * Atomic class names are either 9 chars (legacy hash: `_` + 8) or 11 chars
   * (collisionResistantHash: `_` + 10). We only need to know where the class token
   * ends so the pseudo (if any) can be read relative to that boundary.
   *
   * Since exactly two widths exist, inspecting index 10 is sufficient: if it holds
   * a CSS selector delimiter, the class ended at 9 chars; otherwise index 10 is
   * still a hash character and the class is the 11-char form (boundary at index 12).
   *
   * We test for a delimiter (`isClassBoundary`) rather than the hash alphabet: the
   * question is "did the class token end?", not "which characters did the hasher
   * emit?". This keeps the legacy 9-char path correct for every continuation
   * (`:`, `{`, `[`, `.`, `#`, space, `>`, `+`, `~`, `,`), where a delimiter-poor
   * check would misread e.g. `._legacyhsh a:visited` as an 11-char class.
   */
  const classEnd = isClassBoundary(sheet.charCodeAt(10)) ? 10 : 12;

  if (sheet.charCodeAt(classEnd) === 58 /* ":" */) {
    // We send through a subset of the string instead of the full pseudo name:
    // drop the colon plus the first three characters, e.g. `"focus-visible"`
    // becomes `"us-visible"`. Compound selectors slice an unmapped fragment
    // (e.g. `"ited:hover"`) and so fall through to the catch-all bucket, matching
    // the legacy behavior. Return a mapped pseudo else the default catch all bucket.
    const mapped = pseudosMap[sheet.slice(classEnd + 4, firstBracket)];
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
  const sheet = style.sheet as CSSStyleSheet;

  // Used to avoid unhandled exceptions across browsers with prefixed selectors such as -moz-placeholder.
  try {
    sheet.insertRule(css, sheet.cssRules.length);
  } catch {}
}

/**
 * Inserts a non-atomic CSS rule (generated by `cssMapScoped`) into the dedicated
 * `'cc'` style bucket, bypassing the shorthand bucket sorting logic in
 * `getStyleBucketName`.
 *
 * Non-atomic rules contain multiple declarations per selector and must preserve their
 * source order relative to each other. The shorthand bucket logic is designed for
 * single-declaration atomic rules only — applying it to multi-declaration non-atomic
 * rules would sort them by their first property, breaking the intended CSS cascade.
 *
 * The dedicated `'cc'` bucket is critical for correctness in production: atomic rules
 * are injected via `sheet.insertRule()` (CSSOM-only; the `<style>`'s `textContent`
 * stays empty). If non-atomic rules were `appendData`'d onto the same `<style>` that
 * owns atomic CSSOM rules, the browser would reparse the sheet from the newly
 * populated text node and DISCARD every previously inserted atomic rule — an
 * observable global style wipe. Routing non-atomic rules to their own `<style>`
 * element makes that mixing impossible by construction.
 */
export function insertNonAtomicRule(css: string, opts: StyleSheetOpts): void {
  // Use the dedicated 'cc' bucket to (a) preserve source-order cascade for the
  // multi-rule `cssMapScoped` payload, and (b) guarantee we never mutate the text
  // node of any atomic bucket's `<style>` element. `insertRule` only accepts a
  // single rule per call, so we use `Text.appendData` — it appends to an existing
  // text node in a single DOM mutation (no new text node creation, no parsing
  // limits, accepts multi-rule strings).
  const style = lazyAddStyleBucketToContainer('cc', opts);
  const text = style.firstChild as Text | null;
  if (text) {
    text.appendData(css);
  } else {
    style.appendChild(document.createTextNode(css));
  }
}
