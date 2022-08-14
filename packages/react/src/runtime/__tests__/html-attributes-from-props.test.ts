import htmlAttributesFromProps from '../html-attributes-from-props';

jest.mock('@emotion/is-prop-valid', () => ({
  __esModule: true,
  default: jest.fn((key: string) => !key.includes('invalid')),
}));

describe('htmlAttributesFromProps', () => {
  it('returns props deemed to be valid HTML attributes', () => {
    const validAttributes = { id: 'id', name: 'name' };

    expect(htmlAttributesFromProps({ ...validAttributes, invalid: 'invalid' })).toEqual(
      validAttributes
    );
  });

  it('returns empty object when no HTML attributes exist in props', () => {
    expect(htmlAttributesFromProps({ invalid1: 'invalid1', invalid2: 'invalid2' })).toEqual({});
  });
});
