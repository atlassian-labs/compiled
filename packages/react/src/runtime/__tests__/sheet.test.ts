import { getStyleBucketName } from '../sheet';

/**
 * Characterization of `getStyleBucketName` bucketing behavior.
 *
 * Every scenario is defined once by the CSS that follows the leading atomic class,
 * then run against BOTH supported hash widths:
 *   - legacy 9-char class names (`._` + 7 hash chars)
 *   - collision-resistant 11-char class names (`._` + 9 hash chars)
 *
 * Both widths share a single expected bucket, so each test proves the two hashes
 * land on the same bucket. This makes the "changing hash width does not change
 * bucketing" contract structural: a scenario cannot assert different behavior for
 * the two widths, and the widths cannot drift apart across separate files.
 */

// Real, representative atomic-class prefixes of each supported width. Only the
// length and (base-62) characters matter to bucketing, so fixed stubs are enough.
const LEGACY_PREFIX = '._syaz5scu'; // 9-char class: '.' + '_' + 8 chars
const CR_PREFIX = '._1UtDYzGowl'; // 11-char class: '.' + '_' + 10 chars

/**
 * A scenario describes the selector shape after the leading atomic class.
 *  - `rest`: appended directly to the prefix (`prefix + rest`).
 *  - `build`: full control, used when the class must appear more than once
 *    (e.g. transformed compound selectors like `._h:hover._h:focus`).
 */
type Scenario = {
  name: string;
  expected: string;
  rest?: string;
  build?: (prefix: string) => string;
};

const render = (prefix: string, scenario: Scenario): string =>
  scenario.build ? scenario.build(prefix) : `${prefix}${scenario.rest ?? ''}`;

/** Expands a scenario into one `[hashLabel, sheet]` row per supported hash width. */
const eachHash = (scenario: Scenario): [string, string][] => [
  ['legacy 9-char', render(LEGACY_PREFIX, scenario)],
  ['collision-resistant 11-char', render(CR_PREFIX, scenario)],
];

const runBoth = (scenario: Scenario, assert: (sheet: string) => void) =>
  it.each(eachHash(scenario))('with a %s hash', (_hash, sheet) => assert(sheet));

describe('getStyleBucketName (characterization of current behavior)', () => {
  // Case 1: a pseudo applied directly to a single atomic class routes to its own
  // dedicated bucket. These are the simplest selector shapes — `<atomic-class>:<pseudo>`
  // with nothing between the class and the pseudo — and must behave identically for
  // both hash widths.
  describe('routes a pseudo applied directly to an atomic class to its dedicated bucket', () => {
    const mapped: Scenario[] = [
      { name: ':link', rest: ':link{color:red}', expected: 'l' },
      { name: ':visited', rest: ':visited{color:red}', expected: 'v' },
      { name: ':focus-within', rest: ':focus-within{color:red}', expected: 'w' },
      { name: ':focus', rest: ':focus{color:red}', expected: 'f' },
      { name: ':focus-visible', rest: ':focus-visible{color:red}', expected: 'i' },
      { name: ':hover', rest: ':hover{color:red}', expected: 'h' },
      { name: ':active', rest: ':active{color:red}', expected: 'a' },
      // Historical alias: the compact lookup drops `:aft` and sees `er`, the same
      // key as `:hover`. This pre-existing legacy alias must remain stable.
      { name: ':after (historical hover alias)', rest: ':after{content:"a"}', expected: 'h' },
    ];

    describe.each(mapped)('buckets $name', (scenario) => {
      runBoth(scenario, (sheet) => expect(getStyleBucketName(sheet)).toEqual(scenario.expected));
    });
  });

  // Case 2: a pseudo bucket is chosen ONLY when a mapped pseudo attaches directly
  // to the atomic class. Every other selector shape falls through to the catch-all
  // bucket (''), preserving pre-existing behavior (before Collision-Resistant Hash).
  describe('falls back to the catch-all bucket when no mapped pseudo attaches directly to the atomic class', () => {
    const catchAll: Scenario[] = [
      { name: 'a plain declaration', rest: '{color:red}', expected: '' },
      { name: 'a longhand (non-shorthand) property', rest: '{border-top-color:red}', expected: '' },
      { name: 'an unmapped legacy pseudo element', rest: ':before{content:"a"}', expected: '' },
      { name: 'an unmapped modern pseudo element', rest: '::before{content:"a"}', expected: '' },
      {
        name: 'another unmapped modern pseudo element',
        rest: '::after{content:"a"}',
        expected: '',
      },
      {
        name: 'an unmapped structural pseudo class',
        rest: ':first-child{color:red}',
        expected: '',
      },
      { name: 'an attribute-qualified selector', rest: '[data-selector]{color:red}', expected: '' },
      {
        name: 'an attribute-qualified pseudo selector',
        rest: '[data-selector]:hover{color:red}',
        expected: '',
      },
      { name: 'a class-qualified pseudo selector', rest: '.x:hover{color:red}', expected: '' },
      { name: 'an ID-qualified pseudo selector', rest: '#x:hover{color:red}', expected: '' },
      // Descendant selectors carry the pseudo on a nested element, not on the
      // atomic class — true regardless of hash width. The character at the class
      // boundary is a combinator (space or `>`), not `:`, so no pseudo bucket is
      // selected and they fall through to catch-all. These are real `transformCss()`
      // shapes (e.g. design-system link styles).
      { name: 'a descendant pseudo selector', rest: ' a:visited{color:red}', expected: '' },
      { name: 'a descendant link selector', rest: ' a:link{color:red}', expected: '' },
      { name: 'a child-combinator pseudo selector', rest: '>a:visited{color:red}', expected: '' },
    ];

    describe.each(catchAll)('for $name', (scenario) => {
      runBoth(scenario, (sheet) => expect(getStyleBucketName(sheet)).toEqual(''));
    });
  });

  // Case 2b (regression guard): compound pseudos combine two mapped pseudos, but
  // the boundary slice yields an unmapped fragment (e.g. "ited:hover"), so they
  // intentionally fall through to the catch-all bucket.
  describe('falls back to the catch-all bucket for compound pseudo selectors (the #1930 regression site)', () => {
    const compound: Scenario[] = [
      { name: 'a compound pseudo selector', rest: ':hover:focus{color:red}', expected: '' },
      {
        // The atomic class appears twice, so this scenario builds the full sheet.
        name: 'a transformed compound pseudo selector',
        build: (prefix) => `${prefix}:hover${prefix}:focus{color:red}`,
        expected: '',
      },
      {
        name: 'a compound visited+hover selector',
        rest: ':visited:hover{color:red}',
        expected: '',
      },
      {
        name: 'a compound visited+active selector',
        rest: ':visited:active{color:red}',
        expected: '',
      },
    ];

    describe.each(compound)('for $name', (scenario) => {
      runBoth(scenario, (sheet) => expect(getStyleBucketName(sheet)).toEqual(''));
    });
  });

  // Case 3: shorthand properties are bucketed by their expansion depth so that
  // more-specific longhands can override them in source order (s-0 … s-N).
  describe('buckets shorthand properties by expansion depth', () => {
    const shorthand: Scenario[] = [
      { name: 'all', rest: '{all:unset}', expected: 's-0' },
      { name: 'border', rest: '{border:1px solid red}', expected: 's-1' },
      { name: 'margin-inline', rest: '{margin-inline:0}', expected: 's-2' },
      { name: 'border-block', rest: '{border-block:1px solid red}', expected: 's-3' },
      { name: 'border-top', rest: '{border-top:1px solid red}', expected: 's-4' },
      { name: 'border-block-start', rest: '{border-block-start:1px solid red}', expected: 's-5' },
    ];

    describe.each(shorthand)('buckets the shorthand $name', (scenario) => {
      runBoth(scenario, (sheet) => expect(getStyleBucketName(sheet)).toEqual(scenario.expected));
    });
  });

  // At-rules are bucketed by their leading `@`, independent of hash width.
  describe('buckets at-rules into the media bucket (m)', () => {
    const atRule: Scenario = {
      name: '@media',
      build: (prefix) => `@media screen{${prefix}:hover{color:red}}`,
      expected: 'm',
    };

    runBoth(atRule, (sheet) => expect(getStyleBucketName(sheet)).toEqual('m'));
  });
});
