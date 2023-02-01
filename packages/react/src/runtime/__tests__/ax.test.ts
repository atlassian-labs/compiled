import ax from '../ax';

describe('ax', () => {
  const isEnabled: boolean = (() => false)();

  it.each([
    ['should handle empty array', [], undefined],
    ['should handle array with undefined', [undefined], undefined],
    ['should join single classes together', ['foo', 'bar'], 'foo bar'],
    ['should join multi classes together', ['foo baz', 'bar'], 'foo baz bar'],
    ['should remove undefined', ['foo', 'bar', undefined], 'foo bar'],
    [
      'should ensure the last atomic declaration of a single group wins',
      ['_aaaabbbb', '_aaaacccc'],
      '_aaaacccc',
    ],
    [
      'should ensure the last atomic declaration of a single group with short class name wins',
      ['_aaaabbbb', '_aaaacccc', '_aaaa_a'],
      'a',
    ],
    [
      'should ensure the last atomic declaration of many single groups wins',
      ['_aaaabbbb', '_aaaacccc', '_aaaadddd', '_aaaaeeee'],
      '_aaaaeeee',
    ],
    [
      'should ensure the last atomic declaration of many single groups with short class name wins',
      ['_aaaabbbb', '_aaaacccc', '_aaaa_a', '_aaaa_b'],
      'b',
    ],
    [
      'should ensure the last atomic declaration of a multi group wins',
      ['_aaaabbbb _aaaacccc'],
      '_aaaacccc',
    ],
    [
      'should ensure the last atomic declaration of a multi group with short class name wins',
      ['_aaaa_e', '_aaaabbbb _aaaacccc'],
      '_aaaacccc',
    ],
    [
      'should ensure the last atomic declaration of many multi groups wins',
      ['_aaaabbbb _aaaacccc _aaaadddd _aaaaeeee'],
      '_aaaaeeee',
    ],
    [
      'should ensure the last atomic declaration of many multi groups with short class name wins',
      ['_aaaabbbb', '_aaaa_a', '_bbbb_b', '_ddddcccc'],
      'a b _ddddcccc',
    ],
    [
      'should not remove any atomic declarations if there are no duplicate groups',
      ['_aaaabbbb', '_bbbbcccc'],
      '_aaaabbbb _bbbbcccc',
    ],
    [
      'should not remove any atomic declarations if there are short class name and no duplicate groups',
      ['_eeee_e', '_aaaabbbb', '_bbbbcccc'],
      'e _aaaabbbb _bbbbcccc',
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
    [
      'should ignore non atomic declarations when atomic declarations with short class name exist',
      ['hello_there', 'hello_world', '_aaaa_a'],
      'hello_there hello_world a',
    ],
  ])('%s', (_, params, result) => {
    expect(result).toEqual(ax(params));
  });
});
