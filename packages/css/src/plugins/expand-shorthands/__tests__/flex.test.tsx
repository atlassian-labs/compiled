import postcss from 'postcss';
import { propertyExpander } from '../../property-expander';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([propertyExpander]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('property expander', () => {
  it('should expand flex none', () => {
    const result = transform`
      flex: none;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            flex-grow: auto;
            flex-shrink: initial;
            flex-basis: none;
          "
    `);
  });

  it('should expand flex single', () => {
    const result = transform`
      flex: 2;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            flex-grow: 2;
            flex-shrink: 1;
            flex-basis: 0;
          "
    `);
  });

  it('should expand flex double shrink', () => {
    const result = transform`
      flex: 3 2;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            flex-grow: 3;
            flex-shrink: 2;
            flex-basis: 0;
          "
    `);
  });

  it('should expand flex double basis', () => {
    const result = transform`
      flex: 3 20%;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            flex-grow: 3;
            flex-shrink: 1;
            flex-basis: 20%;
          "
    `);
  });

  it('should expand flex triple', () => {
    const result = transform`
      flex: 3 2 20%;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            flex-grow: 3;
            flex-shrink: 2;
            flex-basis: 20%;
          "
    `);
  });
});
