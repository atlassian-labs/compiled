import postcss from 'postcss';

import { increaseSpecificity } from '../increase-specificity';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([increaseSpecificity()]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('increase specicifity plugin', () => {
  it('should increase specicifity of declared classes', () => {
    const actual = transform`
      .foo {}
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
            .foo:not(#\\9) {}
          "
    `);
  });

  it('should ignore atrules', () => {
    const actual = transform`
      @media {
        .foo {}
      }
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
            @media {
              .foo:not(#\\9) {}
            }
          "
    `);
  });

  it('should ignore root elements', () => {
    const actual = transform`
      html {}
      :root {}
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
            html {}
            :root {}
          "
    `);
  });

  it('should prepend selector before other pseudos', () => {
    const actual = transform`
      .foo:hover {
        color: red;
      }

      .baz::before {
        content: "bar";
      }
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
            .foo:not(#\\9):hover {
              color: red;
            }

            .baz:not(#\\9)::before {
              content: "bar";
            }
          "
    `);
  });
});
