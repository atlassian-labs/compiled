import postcss from 'postcss';
import { propertyExpander } from '../property-expander';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([propertyExpander]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('property expander', () => {
  it('should expand margin', () => {
    const result = transform`
      margin: 0;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            margin: 0;
          "
    `);
  });
});
