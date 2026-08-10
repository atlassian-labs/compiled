/**
 * Ordered style buckets using their short psuedo name.
 * If changes are needed make sure that it aligns with the definition in `sort-at-rule-pseudos.tsx`.
 */
export const styleBucketOrdering: string[] = [
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
const styleBucketsInHead: Record<string, HTMLStyleElement> = {};

/**
 * Maps the long pseudo name to the short pseudo name.
 * Pseudos that match here will be ordered,
 * everythin else will make their way to the catch all style bucket.
 * We reduce the pseduo name to save bundlesize.
 * Thankfully there aren't any overlaps, see: https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes.
 */
const pseudosMap: Record<string, string> = {
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

type StyleBucketOptions = {
  nonce?: string;
};

/**
 * Lazily adds a `<style>` bucket to the `<head>`.
 * This will ensure that the style buckets are ordered.
 *
 * @param bucketName Bucket to insert in the head.
 * @param opts
 */
function lazyAddStyleBucketToHead(
  bucketName: string,
  { nonce }: StyleBucketOptions
): HTMLStyleElement {
  if (!styleBucketsInHead[bucketName]) {
    let currentBucketIndex = styleBucketOrdering.indexOf(bucketName) + 1;
    let nextBucketFromCache = null;

    for (; currentBucketIndex < styleBucketOrdering.length; currentBucketIndex++) {
      // Find the next bucket which we will add our new style bucket before.
      const nextBucket = styleBucketsInHead[styleBucketOrdering[currentBucketIndex]];
      if (nextBucket) {
        nextBucketFromCache = nextBucket;
        break;
      }
    }

    const tag = document.createElement('style');
    nonce && tag.setAttribute('nonce', nonce);
    tag.appendChild(document.createTextNode(''));
    styleBucketsInHead[bucketName] = tag;
    document.head.insertBefore(tag, nextBucketFromCache);
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

const getStyleBucketName = (sheet: string): string => {
  // We are grouping all the at-rules like @media, @supports etc under `m` bucket.
  if (sheet.charCodeAt(0) === 64 /* "@" */) {
    return 'm';
  }

  const firstBracket = sheet.indexOf('{');

  /**
   * Atomic class names are either 9 chars (legacy hash: `_` + 8) or 11 chars
   * (collisionResistantHash: `_` + 10). Since exactly two widths exist, inspecting
   * index 10 is sufficient: a CSS selector delimiter there means the class ended at
   * 9 chars, otherwise index 10 is still a hash character and the class is the
   * 11-char form (boundary at index 12). We test for a delimiter rather than the
   * hash alphabet — the question is "did the class token end?". Keep this aligned
   * with `packages/react/src/runtime/sheet.ts`.
   */
  const classEnd = isClassBoundary(sheet.charCodeAt(10)) ? 10 : 12;

  if (sheet.charCodeAt(classEnd) === 58 /* ":" */) {
    // We send through a subset of the string instead of the full pseudo name.
    // For example `"focus-visible"` name would instead of `"us-visible"`.
    // Return a mapped pseudo else the default catch all bucket.
    return pseudosMap[sheet.slice(classEnd + 4, firstBracket)] || '';
  }

  // Return default catch all bucket
  return '';
};

export type CreateStyleSheetOptions = StyleBucketOptions;

/**
 * Returns a style sheet object that is used to move styles to the head of the application during runtime.
 *
 * @param opts StyleSheetOpts
 */
export function createStyleSheet(opts: CreateStyleSheetOptions) {
  return (css: string): void => {
    const bucketName = getStyleBucketName(css);
    const style = lazyAddStyleBucketToHead(bucketName, opts);

    if (process.env.NODE_ENV === 'production') {
      const sheet = style.sheet as CSSStyleSheet;
      sheet.insertRule(css, sheet.cssRules.length);
    } else {
      style.appendChild(document.createTextNode(css));
    }
  };
}
