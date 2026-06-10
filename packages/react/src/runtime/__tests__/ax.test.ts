import ax from '../ax';

describe('ax - common', () => {
  const isEnabled: boolean = (() => false)();

  it.each([
    ['should handle empty array', [], undefined],
    ['should handle array with undefined', [undefined], undefined],
    ['should handle array with falsy values', [undefined, null, false as const, ''], undefined],
    ['should join single classes together', ['foo', 'bar'], 'foo bar'],
    ['should join multi classes together', ['foo baz', 'bar'], 'foo baz bar'],
    ['should remove undefined', ['foo', 'bar', undefined], 'foo bar'],
    ['should not apply conditional class', [isEnabled && 'foo', 'bar'], 'bar'],
    [
      'should ignore non atomic declarations',
      ['hello_there', 'hello_world'],
      'hello_there hello_world',
    ],
    ['should remove duplicate custom class names', ['a', 'a'], 'a'],
  ])('%s', (_, params, expected) => {
    expect(ax(params)).toEqual(expected);
  });
});

describe('ax - atomic', () => {
  it.each([
    [
      'should ensure the last atomic declaration of a single group wins',
      ['_aaaabbbb', '_aaaacccc'],
      '_aaaacccc',
    ],
    [
      'should ensure the last atomic declaration of many single groups wins',
      ['_aaaabbbb', '_aaaacccc', '_aaaadddd', '_aaaaeeee'],
      '_aaaaeeee',
    ],
    [
      'should ensure the last atomic declaration of a multi group wins',
      ['_aaaabbbb _aaaacccc'],
      '_aaaacccc',
    ],
    [
      'should ensure the last atomic declaration of many multi groups wins',
      ['_aaaabbbb _aaaacccc _aaaadddd _aaaaeeee'],
      '_aaaaeeee',
    ],
    [
      'should ensure the last atomic declaration of many multi groups wins (same group length)',
      ['_aaaabbbb', '_aaaacccc', '_ddddbbbb', '_ddddcccc'],
      '_aaaacccc _ddddcccc',
    ],
    [
      'should not remove any atomic declarations if there are no duplicate groups',
      ['_aaaabbbb', '_bbbbcccc'],
      '_aaaabbbb _bbbbcccc',
    ],
    [
      'should ignore non atomic declarations when atomic declarations exist',
      ['hello_there', 'hello_world', '_aaaabbbb'],
      'hello_there hello_world _aaaabbbb',
    ],
  ])('%s', (_, params, expected) => {
    expect(ax(params)).toEqual(expected);
  });
});

describe('ax - non-atomic', () => {
  it.each([
    ['should pass through a single cc- class unchanged', ['cc-1c2j123'], 'cc-1c2j123'],
    [
      'should join multiple distinct cc- classes',
      ['cc-1c2j123', 'cc-o9delr'],
      'cc-1c2j123 cc-o9delr',
    ],
    ['should deduplicate identical cc- classes', ['cc-1c2j123', 'cc-1c2j123'], 'cc-1c2j123'],
    [
      'should handle a conditional cc- class evaluating to false',
      // When isDanger is false, JS evaluates (isDanger && styles.danger) → false
      // before passing to ax(). So ax() receives ['cc-1c2j123', false].
      ['cc-1c2j123', false as const],
      'cc-1c2j123',
    ],
    [
      'should handle two cc- classes from a ternary expression',
      // When fg_typography_ugc is true, JS evaluates the ternary to 'cc-116z3w0'
      // before passing to ax(). So ax() receives ['cc-1c2j123', 'cc-116z3w0'].
      ['cc-1c2j123', 'cc-116z3w0'],
      'cc-1c2j123 cc-116z3w0',
    ],
    [
      'should handle mixed atomic and non-atomic classes — cc- classes are preserved alongside _ classes',
      // ax() can receive both atomic (_) classes from css()/styled() and non-atomic
      // (cc-) classes from cssMap with atomic: false in the same call.
      // Atomic group "aaaa" is deduped to its last value; cc- classes are all preserved.
      ['_aaaabbbb', 'cc-1c2j123', '_aaaacccc', 'cc-o9delr'],
      '_aaaacccc cc-1c2j123 cc-o9delr',
    ],
    [
      'should not treat cc- as an atomic group (different cc- classes are not deduped by prefix)',
      // cc-1c2j123, cc-o9delr and cc-5f5vfj all start with "cc-" but each is a
      // distinct variant with a unique full class name as key — none should be dropped.
      ['cc-1c2j123', 'cc-o9delr', 'cc-5f5vfj'],
      'cc-1c2j123 cc-o9delr cc-5f5vfj',
    ],
    [
      'should handle the full editor pattern: always-on + conditional cc- classes',
      // ax() receives the already-evaluated results of:
      //   [styles.base, isFullPage && styles.fullPage, isDense && styles.dense]
      // where isDense evaluated to false, so ax() gets ['cc-1uj13gm', 'cc-5f5vfj', false].
      ['cc-1uj13gm', 'cc-5f5vfj', false as const],
      'cc-1uj13gm cc-5f5vfj',
    ],
  ])('%s', (_, params, expected) => {
    expect(ax(params)).toEqual(expected);
  });
});
