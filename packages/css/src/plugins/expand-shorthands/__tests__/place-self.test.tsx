import postcss from 'postcss';
import { propertyExpander } from '../../property-expander';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([propertyExpander]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('property expander', () => {
  it('should expand place self single', () => {
    const result = transform`
      place-self: start;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            align-self: start;
            justify-self: start;
          "
    `);
  });

  it('should expand place self double', () => {
    const result = transform`
      place-self: start end;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            align-self: start;
            justify-self: end;
          "
    `);
  });
});
