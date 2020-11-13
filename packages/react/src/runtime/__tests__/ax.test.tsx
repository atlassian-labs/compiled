import ax from '../ax';

describe('ax', () => {
  it('should join single classes together', () => {
    const result = ax(['foo', 'bar']);

    expect(result).toEqual('foo bar');
  });

  it('should join multi classes together', () => {
    const result = ax(['foo baz', 'bar']);

    expect(result).toEqual('foo baz bar');
  });

  it('should remove undefined', () => {
    const result = ax(['foo', 'bar', undefined]);

    expect(result).toEqual('foo bar');
  });

  it('should ensure the last atomic declaration of a single group wins', () => {
    const result = ax(['_aaaabbbb', '_aaaacccc']);

    expect(result).toEqual('_aaaacccc');
  });

  it('should ensure the last atomic declaration of a multi group wins', () => {
    const result = ax(['_aaaabbbb _aaaacccc', 'foo']);

    expect(result).toEqual('_aaaacccc foo');
  });

  it('should not remove any atomic declarations if there are no duplicate groups', () => {
    const result = ax(['_aaaabbbb', '_bbbbcccc']);

    expect(result).toEqual('_aaaabbbb _bbbbcccc');
  });

  it('should not apply conditional class', () => {
    const isEnabled: boolean = (() => false)();
    const result = ax([isEnabled && 'foo', 'bar']);

    expect(result).toEqual('bar');
  });

  it('should ignore non atomic declarations', () => {
    const result = ax(['hello_there', 'hello_world']);

    expect(result).toEqual('hello_there hello_world');
  });
});
