import postcss from 'postcss';
import { expandShorthands } from '..';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([expandShorthands]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('property value ordering', () => {
  it('should order value', () => {
    const result = transform`
      column-rule: thick inset blue;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            column-rule: blue inset thick;
          "
    `);
  });
});
