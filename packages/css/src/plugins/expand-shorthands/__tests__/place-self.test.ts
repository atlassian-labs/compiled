import postcss from 'postcss';

import { expandShorthands } from '../../expand-shorthands';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([expandShorthands()]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('place self property expander', () => {
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
