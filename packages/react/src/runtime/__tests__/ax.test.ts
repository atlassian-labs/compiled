import ax from '../ax';

describe('ax', () => {
  const isEnabled: boolean = (() => false)();

  it.each([
    ['should handle empty array', [], undefined],
    ['should handle array with undefined', [undefined], undefined],
    ['should handle array with falsy values', [undefined, null, false as const, ''], undefined],
    ['should join single classes together', ['foo', 'bar'], 'foo bar'],
    ['should join multi classes together', ['foo baz', 'bar'], 'foo baz bar'],
    ['should remove undefined', ['foo', 'bar', undefined], 'foo bar'],
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
    // ── tests for the 10-char default class name shape: `_` + 5 group + 4 value ──
    [
      'should dedup 10-char classes with the same 5-char group (single classes)',
      ['_aaaaabbbb', '_aaaaacccc'],
      '_aaaaacccc',
    ],
    [
      'should dedup 10-char classes with the same 5-char group (multi class)',
      ['_aaaaabbbb _aaaaacccc _aaaaadddd _aaaaaeeee'],
      '_aaaaaeeee',
    ],
    [
      'should keep 10-char classes from different 5-char groups',
      ['_aaaaabbbb', '_bbbbbcccc'],
      '_aaaaabbbb _bbbbbcccc',
    ],
    // ── tests for variable-length group (e.g. when the compiler grew the hash to resolve a collision) ──
    [
      'should dedup 11-char classes with the same 6-char extended group',
      ['_aaaaa1bbbb', '_aaaaa1cccc'],
      '_aaaaa1cccc',
    ],
    [
      'should treat 10-char and 11-char classes as different groups (group length differs)',
      ['_aaaaaxxxx', '_aaaaa1xxxx'],
      '_aaaaaxxxx _aaaaa1xxxx',
    ],
    // ── tests for mixed legacy 9-char and current 10-char class names ──
    [
      'should treat a 9-char legacy class and a 10-char class as different groups',
      ['_aaaabbbb', '_aaaaabbbb'],
      '_aaaabbbb _aaaaabbbb',
    ],
    [
      'should dedup 10-char classes even when 9-char classes share their value suffix',
      ['_aaaaabbbb', '_aaaabbbb', '_aaaaacccc'],
      '_aaaaacccc _aaaabbbb',
    ],
    [
      // Under the dynamic group-length scheme, class names of different total length
      // are treated as different groups (the group is everything except the last 4 chars).
      // Here `_aaaaaaa` (8 chars) has group `_aaaa`, while `_aaaabbbb` (9 chars) has
      // group `_aaaab` — they intentionally do not deduplicate.
      'should treat classes of different total length as different groups',
      ['_aaaabbbb', '_aaaaaaa', '_ddddbbb', '_ddddcccc'],
      '_aaaabbbb _aaaaaaa _ddddbbb _ddddcccc',
    ],
    [
      'should not remove any atomic declarations if there are no duplicate groups',
      ['_aaaabbbb', '_bbbbcccc'],
      '_aaaabbbb _bbbbcccc',
    ],
    ['should not apply conditional class', [isEnabled && 'foo', 'bar'], 'bar'],
    [
      'should ignore non atomic declarations',
      ['hello_there', 'hello_world'],
      'hello_there hello_world',
    ],
    [
      'should ignore non atomic declarations when atomic declarations exist',
      ['hello_there', 'hello_world', '_aaaabbbb'],
      'hello_there hello_world _aaaabbbb',
    ],
    ['should remove duplicate custom class names', ['a', 'a'], 'a'],
  ])('%s', (_, params, expected) => {
    expect(ax(params)).toEqual(expected);
  });
});
