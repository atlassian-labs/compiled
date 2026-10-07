import { sort } from '@compiled/css';

import { collectAtomicClassNames, sortAtomicRulesOnly } from '../scoped-sort';

const font = '._11c8wadc{font:var(--ds-font-body-small)}';
const fontWeight = '._k48pwu06{font-weight:var(--ds-font-weight-bold,653)}';
const classNames = new Set(['_11c8wadc', '_k48pwu06', '_syaz1234', '_irr3abcd', '_m1']);

// Compiled's sort normalises whitespace, so compare ignoring it.
const sortOnly = (css: string, names: ReadonlySet<string> = classNames) =>
  sortAtomicRulesOnly(css, names, sort)
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,:])\s*/g, '$1')
    .trim();

describe('collectAtomicClassNames', () => {
  it('records the leading class of every selector, including nested at-rules', () => {
    const names = new Set<string>();

    collectAtomicClassNames(
      '._a1{color:red}._b2:hover,._c3>*{color:blue}@media (min-width:1px){._d4{color:red}}',
      names
    );

    expect([...names].sort()).toEqual(['_a1', '_b2', '_c3', '_d4']);
  });
});

describe('sortAtomicRulesOnly', () => {
  it('moves a shorthand ahead of the longhand it would otherwise override', () => {
    expect(sortOnly(`${fontWeight}${font}`)).toBe(`${font}${fontWeight}`);
  });

  it('never moves or sorts rules whose classes were not collected', () => {
    const moduleRule = '._selected_cbzkj_92{color:blue}';
    const globalRule = '.Editor_abc{font:inherit}';
    const css = `${fontWeight}${moduleRule}${globalRule}${font}`;

    expect(sortOnly(css)).toBe(`${font}${fontWeight}${moduleRule}${globalRule}`);
  });

  it('keeps rules from other sources in order even when sort() would move them', () => {
    const css = '.a{padding-left:4px}.a{padding:0}';

    expect(sortOnly(`${css}${fontWeight}${font}`)).toBe(`${css}${font}${fontWeight}`);
    expect(sort(css).replace(/\s+/g, '')).not.toBe(css);
  });

  it('puts the sorted block where the first atomic rule was', () => {
    const css = `.before{color:red}${fontWeight}.mid{color:blue}${fontWeight}${font}`;

    expect(sortOnly(css)).toBe(`.before{color:red}${font}${fontWeight}.mid{color:blue}`);
  });

  it('does not treat a selector list that mixes in other classes as atomic', () => {
    const merged = '._11c8wadc,a._10uewadc{font:inherit}';

    expect(sortOnly(`${fontWeight}${merged}`)).toBe(`${fontWeight}${merged}`);
  });

  it('sorts atomic at-rules and the atomic rules inside mixed at-rules', () => {
    const media = '@media (min-width:1px){._m1{font:x}}';
    const mixed = `@media print{${fontWeight}.Other{color:red}${font}}`;

    expect(sortOnly(`${media}${fontWeight}${font}`)).toBe(`${font}${fontWeight}${media}`);
    expect(sortOnly(mixed)).toBe(`@media print{${font}${fontWeight}.Other{color:red}}`);
  });

  it('returns the CSS unchanged when no class names were collected', () => {
    const css = `${fontWeight}${font}`;

    expect(sortAtomicRulesOnly(css, new Set(), sort)).toBe(css);
  });
});
