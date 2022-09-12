import interpolation from '../css-custom-property';

describe('interpolation', () => {
  it('should return an empty CSS comment when undefined', () => {
    const actual = interpolation(undefined, undefined, undefined);

    expect(actual).toEqual('var(--c-, )');
  });

  it('should return an empty CSS comment when null', () => {
    const actual = interpolation(null, undefined, undefined);

    expect(actual).toEqual('var(--c-, )');
  });

  it('should pass through the value if there are no suffix prefix', () => {
    const value = 12;

    const actual = interpolation(value, undefined, undefined);

    expect(actual).toEqual(value);
  });

  it('should return zero', () => {
    const value = 0;

    const actual = interpolation(value, undefined, undefined);

    expect(actual).toEqual(value);
  });

  it('should append suffix', () => {
    const actual = interpolation(12, 'px', undefined);

    expect(actual).toEqual('12px');
  });

  it('should prepend prefix and append suffix', () => {
    const actual = interpolation('hello', '"', '"');

    expect(actual).toEqual('"hello"');
  });
});
