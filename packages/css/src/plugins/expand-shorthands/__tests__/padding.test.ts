import postcss from 'postcss';

import { expandShorthands } from '../../expand-shorthands';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([expandShorthands()]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('padding property expander', () => {
  it('should expand padding single', () => {
    const result = transform`
      padding: 0;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            padding-top: 0;
            padding-right: 0;
            padding-bottom: 0;
            padding-left: 0;
          "
    `);
  });

  it('should expand padding double', () => {
    const result = transform`
      padding: 0 auto;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            padding-top: 0;
            padding-right: auto;
            padding-bottom: 0;
            padding-left: auto;
          "
    `);
  });

  it('should expand padding triple', () => {
    const result = transform`
      padding: 1px 2px 3px;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            padding-top: 1px;
            padding-right: 2px;
            padding-bottom: 3px;
            padding-left: 2px;
          "
    `);
  });

  it('should expand padding quadruple', () => {
    const result = transform`
      padding: 1px 2px 3px 4px;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            padding-top: 1px;
            padding-right: 2px;
            padding-bottom: 3px;
            padding-left: 4px;
          "
    `);
  });
});
