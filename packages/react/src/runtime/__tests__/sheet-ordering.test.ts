import { getStyleBucketName, styleBucketOrdering } from '../sheet';

/**
 * Characterizes the end-to-end bucketing *order* of a full stylesheet, which is
 * where the `1.0.1` regression (#1930) actually surfaced as reordered Jira CSS.
 *
 * The scenario is defined once by rule *shape* and run against BOTH hash widths
 * (legacy 9-char and collision-resistant 11-char), plus a mixed-width sheet — the
 * real migration/skew state where 9-char and 11-char rules coexist.
 */

/**
 * Mirrors the bucket-then-concatenate serialization in `style.tsx` (`Style`):
 * bucket each atomic rule, then concatenate the buckets in `styleBucketOrdering`.
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
 * A single rule of a realistic legacy link-style component, defined independently
 * of hash width: `className` supplies a distinct, readable class per width, and
 * `declaration` is the selector-tail + body appended after the class.
 */
type RuleShape = { declaration: string; bucket: string };

// The link-style component shape, in source order. Mixes compounds (which must
// stay in the catch-all bucket), simple pseudos, and plain declarations. Under the
// correct logic the compounds `:visited:hover` / `:visited:active` remain in
// catch-all so their source order is preserved; a `lastIndexOf`-based lookup would
// move them into `h` / `a` and reorder the stylesheet (the #1930 regression).
const linkComponentShape: RuleShape[] = [
  { declaration: ':visited:hover{color:var(--ds-link-visited,#803fa5)}', bucket: '' },
  { declaration: ':visited:active{color:var(--ds-link-visited-pressed,#48245d)}', bucket: '' },
  { declaration: '{text-decoration-color:initial}', bucket: '' },
  { declaration: '{text-decoration-line:underline}', bucket: '' },
  { declaration: '{text-decoration-style:solid}', bucket: '' },
  { declaration: '{color:var(--ds-link,#1868db)}', bucket: '' },
  { declaration: ':visited{color:var(--ds-link-visited,#803fa5)}', bucket: 'v' },
  { declaration: ':hover{text-decoration-color:initial}', bucket: 'h' },
  { declaration: ':hover{text-decoration-line:none}', bucket: 'h' },
  { declaration: ':hover{text-decoration-style:solid}', bucket: 'h' },
  { declaration: ':hover{color:var(--ds-link,#1868db)}', bucket: 'h' },
  { declaration: ':active{color:var(--ds-link-pressed,#1558bc)}', bucket: 'a' },
];

/**
 * Builds distinct atomic class names of a given width for each rule in a shape.
 * Names must be unique (so the emitted class order is meaningful) and exactly the
 * supported width: 9-char (`_` + 8) or 11-char (`_` + 10). We pad an index-derived
 * base-62 stub to the required hash length.
 */
const buildClasses = (shape: RuleShape[], hashLength: 8 | 10) =>
  shape.map((rule, index) => {
    const stub = `q${index.toString(36)}`; // short, unique-per-index, base-62
    const hash = stub.padEnd(hashLength, '0');
    return { className: `._${hash}`, ...rule };
  });

const toSheets = (rules: ReturnType<typeof buildClasses>): string[] =>
  rules.map((rule) => `${rule.className}${rule.declaration}`);

const expectedBuckets = (rules: ReturnType<typeof buildClasses>): string[] =>
  rules.map((rule) => rule.bucket);

// Emitted order = catch-all rules (source order) then v, then h (source order), then a,
// following `styleBucketOrdering`. Derived from the shape so it stays in sync.
const expectedClassOrder = (rules: ReturnType<typeof buildClasses>): string[] => {
  const byBucket: Record<string, string[]> = {};
  for (const rule of rules) {
    (byBucket[rule.bucket] ||= []).push(rule.className.slice(2));
  }
  return styleBucketOrdering.flatMap((bucket) => byBucket[bucket] || []);
};

describe('mixed-bucket ordering (legacy link-style component)', () => {
  const variants = [
    { label: 'legacy 9-char', rules: buildClasses(linkComponentShape, 8) },
    { label: 'collision-resistant 11-char', rules: buildClasses(linkComponentShape, 10) },
  ] as const;

  describe.each(variants)('with a $label hash', ({ rules }) => {
    it('buckets each rule (compounds land in the catch-all bucket)', () => {
      expect(toSheets(rules).map(getStyleBucketName)).toEqual(expectedBuckets(rules));
    });

    it('emits rules in the expected order (compound source order preserved)', () => {
      expect(classOrder(orderSheets(toSheets(rules)))).toEqual(expectedClassOrder(rules));
    });
  });

  // The real migration/skew state: a single stylesheet containing both 9-char and
  // 11-char rules. Width detection must classify each rule by its own width so the
  // compound stays in catch-all and cross-width source order is preserved.
  describe('with a mixed-width sheet (9-char and 11-char coexisting)', () => {
    const nineChar = buildClasses(linkComponentShape, 8);
    const elevenChar = buildClasses(linkComponentShape, 10).map((rule) => ({
      ...rule,
      // Re-key 11-char class names so they do not collide with the 9-char stubs.
      className: `._z${rule.className.slice(2).padEnd(10, '0').slice(1)}`,
    }));

    // Interleave the two widths to mimic mixed build-path output.
    const mixedRules = nineChar.flatMap((rule, index) => [rule, elevenChar[index]]);

    it('buckets each rule by its own hash width', () => {
      expect(toSheets(mixedRules).map(getStyleBucketName)).toEqual(expectedBuckets(mixedRules));
    });

    it('preserves source order across both widths (compounds stay in catch-all)', () => {
      expect(classOrder(orderSheets(toSheets(mixedRules)))).toEqual(expectedClassOrder(mixedRules));
    });
  });
});
