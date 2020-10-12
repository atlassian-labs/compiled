import postcss from 'postcss';
import { propertyExpander } from '../../property-expander';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([propertyExpander]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('property expander', () => {
  it('should expand place items single', () => {
    const result = transform`
      place-items: center;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            align-items: center;
            justify-items: center;
          "
    `);
  });

  it('should expand place items double', () => {
    const result = transform`
      place-items: auto center;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            align-items: auto;
            justify-items: center;
          "
    `);
  });
});
