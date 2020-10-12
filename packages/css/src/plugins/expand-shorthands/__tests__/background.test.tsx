import postcss from 'postcss';
import { expandShorthands } from '../../expand-shorthands';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([expandShorthands]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('property expander', () => {
  it('should expand background single', () => {
    const result = transform`
      background: red;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            background-color: red;
          "
    `);
  });

  it('should do nothing when background is complex', () => {
    const result = transform`
      background: radial-gradient(crimson, skyblue);
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            background: radial-gradient(crimson, skyblue);
          "
    `);
  });
});
