import ax from '../ax';

describe('ax', () => {
  const isEnabled: boolean = (() => false)();

  describe('general class merging', () => {
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

  describe('legacy atomic class format', () => {
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
        'should treat non-standard shorter atomic-looking class names consistently with suffix parsing',
        ['_aaaabbbb', '_aaaaaaa', '_ddddbbb', '_ddddcccc'],
        '_aaaabbbb _aaaaaaa _ddddcccc',
      ],
      [
        'should not remove any atomic declarations if there are no duplicate groups',
        ['_aaaabbbb', '_bbbbcccc'],
        '_aaaabbbb _bbbbcccc',
      ],
    ])('%s', (_, params, expected) => {
      expect(ax(params)).toEqual(expected);
    });
  });

  describe('variable-length atomic group hash format', () => {
    it.each([
      [
        'should dedup variable-length classes with the same group',
        ['_aaaa12bbbb', '_aaaa12cccc'],
        '_aaaa12cccc',
      ],
      [
        'should dedup variable-length classes in a multi class string',
        ['_aaaa12bbbb _aaaa12cccc'],
        '_aaaa12cccc',
      ],
      [
        'should keep variable-length classes with different groups',
        ['_aaaa12bbbb', '_bbbb12cccc'],
        '_aaaa12bbbb _bbbb12cccc',
      ],
      [
        'should allow a longer group to override its shorter prefix family',
        ['_aaaabbbb', '_aaaa12cccc'],
        '_aaaa12cccc',
      ],
    ])('%s', (_, params, expected) => {
      expect(ax(params)).toEqual(expected);
    });
  });

  describe('mixed legacy and variable-length atomic class formats', () => {
    it.each([
      [
        'should dedup legacy and variable-length classes when they share the same exact group',
        ['_aaaabbbb', '_aaaacccc'],
        '_aaaacccc',
      ],
      [
        'should allow a variable-length longer group to override its legacy prefix family',
        ['_aaaabbbb', '_aaaa12cccc'],
        '_aaaa12cccc',
      ],
      [
        'should keep different variable-length families when no prefix relationship exists',
        ['_aaaabbbb', '_bbbb12cccc'],
        '_aaaabbbb _bbbb12cccc',
      ],
    ])('%s', (_, params, expected) => {
      expect(ax(params)).toEqual(expected);
    });
  });
});
