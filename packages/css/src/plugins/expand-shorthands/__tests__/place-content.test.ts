import postcss from 'postcss';

import { expandShorthands } from '../../expand-shorthands';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([expandShorthands()]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('place content property expander', () => {
  it('should expand place content single', () => {
    const result = transform`
      place-content: center;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            align-content: center;
            justify-content: center;
          "
    `);
  });

  it('should expand place content double', () => {
    const result = transform`
      place-content: center start;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            align-content: center;
            justify-content: start;
          "
    `);
  });

  it('should remove node when invalid single', () => {
    const result = transform`
      place-content: left;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
          "
    `);
  });
});
