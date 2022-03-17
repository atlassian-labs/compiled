import postcss from 'postcss';

import { expandShorthands } from '../../expand-shorthands';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([expandShorthands()]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('text decoration property expander', () => {
  it('should expand text decoration single', () => {
    const result = transform`
      text-decoration: underline;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            text-decoration-color: currentColor;
            text-decoration-line: underline;
            text-decoration-style: solid;
          "
    `);
  });

  it('should expand text decoration line double', () => {
    const result = transform`
      text-decoration: underline overline;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            text-decoration-color: currentColor;
            text-decoration-line: overline underline;
            text-decoration-style: solid;
          "
    `);
  });

  it('should remove text decoration invalid double', () => {
    const result = transform`
      text-decoration: underline underline;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
          "
    `);
  });

  it('should expand text decoration double', () => {
    const result = transform`
      text-decoration: underline red;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            text-decoration-color: red;
            text-decoration-line: underline;
            text-decoration-style: solid;
          "
    `);
  });

  it('should expand text decoration triple', () => {
    const result = transform`
      text-decoration: underline wavy red;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            text-decoration-color: red;
            text-decoration-line: underline;
            text-decoration-style: wavy;
          "
    `);
  });
});
