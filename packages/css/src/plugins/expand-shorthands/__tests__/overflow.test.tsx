import postcss from 'postcss';

import { expandShorthands } from '../../expand-shorthands';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([expandShorthands()]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('overflow property expander', () => {
  it('should expand overflow single', () => {
    const result = transform`
      overflow: hidden;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            overflow-x: hidden;
            overflow-y: hidden;
          "
    `);
  });

  it('should expand overflow double', () => {
    const result = transform`
      overflow: auto hidden;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            overflow-x: auto;
            overflow-y: hidden;
          "
    `);
  });
});
