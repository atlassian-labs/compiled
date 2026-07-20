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
      // _1UtDYzynoA and _1UtDYzGowl both target `color` (same 6-char group _1UtDYz)
      ['_1UtDYzynoA', '_1UtDYzGowl'],
      '_1UtDYzGowl',
    ],
    [
      'should ensure the last atomic declaration of many single groups wins',
      // All four target `color` (group _1UtDYz) — last one wins
      ['_1UtDYzynoA', '_1UtDYzGowl', '_1UtDYzDpLb', '_1UtDYzpjc8'],
      '_1UtDYzpjc8',
    ],
    [
      'should ensure the last atomic declaration of a multi group wins',
      // Two color classes in a single string — last one wins
      ['_1UtDYzynoA _1UtDYzGowl'],
      '_1UtDYzGowl',
    ],
    [
      'should ensure the last atomic declaration of many multi groups wins',
      // Four color classes in a single string — last one wins
      ['_1UtDYzynoA _1UtDYzGowl _1UtDYzDpLb _1UtDYzpjc8'],
      '_1UtDYzpjc8',
    ],
    [
      'should ensure the last atomic declaration of many multi groups with new-format class names wins',
      // New-format atomic classes: `_` + 6-char group + 4-char value = 11 chars total
      // Group key is extracted via `className.length - 4` = first 7 chars
      // _1UtDYz* = color group, _4ya3eE* = font-size group — each deduped independently
      ['_1UtDYzynoA', '_1UtDYzGowl', '_4ya3eErjyG', '_4ya3eEEbN9'],
      '_1UtDYzGowl _4ya3eEEbN9',
    ],
    [
      'should not remove any atomic declarations if there are no duplicate groups',
      // _1UtDYzGowl = color, _4ya3eErjyG = font-size — different groups, both survive
      ['_1UtDYzGowl', '_4ya3eErjyG'],
      '_1UtDYzGowl _4ya3eErjyG',
    ],
    [
      'should correctly dedup within legacy format (9-char, 4-char group)',
      // Two legacy-format color classes — same 4-char group (_syaz), last wins
      // CLEANUP: remove this test when collisionResistantHash becomes the default
      ['_syaz13q2', '_syaz5scu'],
      '_syaz5scu',
    ],
    [
      'should correctly dedup within new format (11-char, 6-char group)',
      // Two new-format color classes — same 6-char group (_1UtDYz), last wins
      ['_1UtDYzynoA', '_1UtDYzGowl'],
      '_1UtDYzGowl',
    ],
    [
      'should not cross-dedup legacy 9-char and new 11-char classes for the same property',
      // During version-skew, ax() receives old 9-char classes from pre-built packages
      // and new 11-char classes from the app's own styles in the same call.
      // Different group key lengths mean they never falsely dedup each other.
      // CLEANUP: remove this test when collisionResistantHash becomes the default
      ['_syaz13q2', '_1UtDYzynoA'],
      '_syaz13q2 _1UtDYzynoA',
    ],
    [
      'should ignore non atomic declarations when atomic declarations exist',
      ['hello_there', 'hello_world', '_1UtDYzGowl'],
      'hello_there hello_world _1UtDYzGowl',
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
      // (cc-) classes from cssMapScoped in the same call.
      // _1UtDYzynoA and _1UtDYzGowl both target color — deduped to last; cc- classes preserved.
      ['_1UtDYzynoA', 'cc-1c2j123', '_1UtDYzGowl', 'cc-o9delr'],
      '_1UtDYzGowl cc-1c2j123 cc-o9delr',
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
