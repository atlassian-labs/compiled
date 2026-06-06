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

describe('ax - default strategy', () => {
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

/**
 * @experimental not supported officially
 * Enhanced strategy classes are 9 chars (same as default: _GGGGVVVV),
 * but the group hash uses base-62 encoding (may include uppercase letters).
 * The same deduplication rules apply as for the default strategy.
 */
describe('ax - enhanced strategy', () => {
  it.each([
    [
      'should ensure the last atomic declaration of a single group wins',
      ['_aAbBcccc', '_aAbBdddd'],
      '_aAbBdddd',
    ],
    [
      'should ensure the last atomic declaration of many single groups wins',
      ['_aAbBcccc', '_aAbBdddd', '_aAbBeeee', '_aAbBffff'],
      '_aAbBffff',
    ],
    [
      'should ensure the last atomic declaration of a multi group wins',
      ['_aAbBcccc _aAbBdddd'],
      '_aAbBdddd',
    ],
    [
      'should ensure the last atomic declaration of many multi groups wins',
      ['_aAbBcccc _aAbBdddd _aAbBeeee _aAbBffff'],
      '_aAbBffff',
    ],
    [
      'should ensure the last atomic declaration of many multi groups wins (same group length)',
      ['_aAbBcccc', '_aAbBdddd', '_xXyYcccc', '_xXyYdddd'],
      '_aAbBdddd _xXyYdddd',
    ],
    [
      'should not remove any atomic declarations if there are no duplicate groups',
      ['_aAbBcccc', '_xXyYcccc'],
      '_aAbBcccc _xXyYcccc',
    ],
    [
      'should ignore non atomic declarations when atomic declarations exist',
      ['hello_there', 'hello_world', '_aAbBcccc'],
      'hello_there hello_world _aAbBcccc',
    ],
  ])('%s', (_, params, expected) => {
    expect(ax(params)).toEqual(expected);
  });
});

/**
 * @experimental not supported officially
 * Max strategy classes are 11 chars (_GGGGGGVVVV — 6-char group, 4-char value).
 * The same deduplication rules apply as for the default strategy.
 */
describe('ax - max strategy', () => {
  it.each([
    [
      'should ensure the last atomic declaration of a single group wins',
      ['_aAbBcCdddd', '_aAbBcCeeee'],
      '_aAbBcCeeee',
    ],
    [
      'should ensure the last atomic declaration of many single groups wins',
      ['_aAbBcCdddd', '_aAbBcCeeee', '_aAbBcCffff', '_aAbBcCgggg'],
      '_aAbBcCgggg',
    ],
    [
      'should ensure the last atomic declaration of a multi group wins',
      ['_aAbBcCdddd _aAbBcCeeee'],
      '_aAbBcCeeee',
    ],
    [
      'should ensure the last atomic declaration of many multi groups wins',
      ['_aAbBcCdddd _aAbBcCeeee _aAbBcCffff _aAbBcCgggg'],
      '_aAbBcCgggg',
    ],
    [
      'should ensure the last atomic declaration of many multi groups wins (same group length)',
      ['_aAbBcCdddd', '_aAbBcCeeee', '_xXyYzZdddd', '_xXyYzZeeee'],
      '_aAbBcCeeee _xXyYzZeeee',
    ],
    [
      'should not remove any atomic declarations if there are no duplicate groups',
      ['_aAbBcCdddd', '_xXyYzZdddd'],
      '_aAbBcCdddd _xXyYzZdddd',
    ],
    [
      'should ignore non atomic declarations when atomic declarations exist',
      ['hello_there', 'hello_world', '_aAbBcCdddd'],
      'hello_there hello_world _aAbBcCdddd',
    ],
  ])('%s', (_, params, expected) => {
    expect(ax(params)).toEqual(expected);
  });
});

/**
 * @experimental not supported officially
 * When default (9-char) and max (11-char) classes share the same CSS property,
 * they will NOT deduplicate each other because their group keys differ in length.
 * Both classes are kept, with specificity order deciding which value takes effect.
 *
 * TODO: In a future PR, ax should correctly
 * deduplicate classes across different hash strategies (e.g. default vs. max),
 * making it safe to mix strategies across packages.
 */
describe('ax - cross-strategy conflicts (known limitation)', () => {
  it.each([
    [
      'should NOT deduplicate default (9-char) vs max (11-char) classes',
      ['_aaaabbbb', '_aaaabbbbcccc'],
      '_aaaabbbb _aaaabbbbcccc',
    ],
    [
      'should NOT deduplicate max (11-char) vs default (9-char) classes',
      ['_aAbBcCdddd', '_aAbBdddd'],
      '_aAbBcCdddd _aAbBdddd',
    ],
  ])('%s', (_, params, expected) => {
    expect(ax(params)).toEqual(expected);
  });
});
