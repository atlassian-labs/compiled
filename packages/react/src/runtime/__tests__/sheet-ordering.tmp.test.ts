import { getStyleBucketName, styleBucketOrdering } from '../sheet';

/**
 * TEMPORARY working file — used only while developing the compound-pseudo
 * bucketing fix. Unlike `sheet.test.ts` (which pins the per-rule bucket of
 * `getStyleBucketName` in isolation), this file exercises the downstream
 * *ordering* consequence: how a full stylesheet is serialized once each rule is
 * bucketed. That ordering is where the `1.0.1` regression actually surfaced.
 *
 * Delete this file before merging the fix — the permanent home for ordering
 * behavior is the SSR path in `style.tsx`, not the `getStyleBucketName` suite.
 */

/**
 * Reproduces the server-side ordering in `Style` (see `style.tsx`): bucket each
 * atomic rule, then concatenate the buckets in `styleBucketOrdering`.
 */
const orderSheets = (sheets: string[]): string => {
  const grouped: Record<string, string> = {};
  for (const sheet of sheets) {
    const bucket = getStyleBucketName(sheet);
    grouped[bucket] = (grouped[bucket] || '') + sheet;
  }
  return styleBucketOrdering.map((bucket) => grouped[bucket] || '').join('');
};

/** Extract the atomic class names (without the leading `._`) in emitted order. */
const classOrder = (sheet: string): string[] =>
  [...sheet.matchAll(/\._([0-9a-zA-Z]+)(?=[:{])/g)].map((match) => match[1]);

/**
 * Mixed-bucket ordering — the real-world manifestation. These are the exact atomic
 * rules emitted for a legacy link-style component (9-char hash), mixing simple
 * pseudos, compounds, and plain declarations. Under the current fixed-offset logic
 * the compounds `:visited:hover` / `:visited:active` stay in the catch-all bucket,
 * so their source order is preserved. A `lastIndexOf`-based lookup would instead
 * move them into `h` / `a`, reordering the stylesheet.
 */
describe('mixed-bucket ordering (legacy link-style component)', () => {
  const linkSheets = [
    '._n0fx1ra0:visited:hover{color:var(--ds-link-visited,#803fa5)}',
    '._1vhv17z1:visited:active{color:var(--ds-link-visited-pressed,#48245d)}',
    '._4bfu18uv{text-decoration-color:initial}',
    '._1hms8stv{text-decoration-line:underline}',
    '._ajmmnqa1{text-decoration-style:solid}',
    '._syaz13af{color:var(--ds-link,#1868db)}',
    '._10531ra0:visited{color:var(--ds-link-visited,#803fa5)}',
    '._9oik18uv:hover{text-decoration-color:initial}',
    '._1bnxglyw:hover{text-decoration-line:none}',
    '._jf4cnqa1:hover{text-decoration-style:solid}',
    '._30l313af:hover{color:var(--ds-link,#1868db)}',
    '._9h8h12zz:active{color:var(--ds-link-pressed,#1558bc)}',
  ];

  it('buckets each rule (compounds land in the catch-all bucket)', () => {
    expect(linkSheets.map(getStyleBucketName)).toEqual([
      '', // :visited:hover  (compound -> catch-all)
      '', // :visited:active (compound -> catch-all)
      '', // text-decoration-color
      '', // text-decoration-line
      '', // text-decoration-style
      '', // color
      'v', // :visited
      'h', // :hover
      'h', // :hover
      'h', // :hover
      'h', // :hover
      'a', // :active
    ]);
  });

  it('emits rules in the expected legacy order', () => {
    expect(classOrder(orderSheets(linkSheets))).toEqual([
      'n0fx1ra0', // :visited:hover  ┐ catch-all, source order preserved
      '1vhv17z1', // :visited:active ┘
      '4bfu18uv',
      '1hms8stv',
      'ajmmnqa1',
      'syaz13af',
      '10531ra0', // :visited
      '9oik18uv', // :hover
      '1bnxglyw',
      'jf4cnqa1',
      '30l313af',
      '9h8h12zz', // :active
    ]);
  });
});
