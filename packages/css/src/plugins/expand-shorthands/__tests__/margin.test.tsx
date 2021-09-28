import postcss from 'postcss';

import { expandShorthands } from '../../expand-shorthands';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([expandShorthands()]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('margin property expander', () => {
  it('should expand margin single', () => {
    const result = transform`
      margin: 0;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            margin-top: 0;
            margin-right: 0;
            margin-bottom: 0;
            margin-left: 0;
          "
    `);
  });

  it('should expand margin double', () => {
    const result = transform`
      margin: 0 auto;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            margin-top: 0;
            margin-right: auto;
            margin-bottom: 0;
            margin-left: auto;
          "
    `);
  });

  it('should expand margin triple', () => {
    const result = transform`
      margin: 1px 2px 3px;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            margin-top: 1px;
            margin-right: 2px;
            margin-bottom: 3px;
            margin-left: 2px;
          "
    `);
  });

  it('should expand margin quadruple', () => {
    const result = transform`
      margin: 1px 2px 3px 4px;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            margin-top: 1px;
            margin-right: 2px;
            margin-bottom: 3px;
            margin-left: 4px;
          "
    `);
  });
});
