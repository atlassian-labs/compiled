import postcss from 'postcss';

import { increaseSpecificity } from '../increase-specificity';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([increaseSpecificity()]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('increase specicifity plugin', () => {
  it('should ignore non-prefixed class names', () => {
    const actual = transform`.foo {}`;

    expect(actual).toMatchInlineSnapshot(`".foo {}"`);
  });

  it('should increase specicifity of declared classes', () => {
    const actual = transform`._foo {}`;

    expect(actual).toMatchInlineSnapshot(`"._foo:not(#\\#) {}"`);
  });

  it('should ignore atrules', () => {
    const actual = transform`
      @media {
        ._foo {}
      }
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
            @media {
              ._foo:not(#\\#) {}
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
      ._foo:hover {
        color: red;
      }

      ._baz::before {
        content: "bar";
      }
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
            ._foo:not(#\\#):hover {
              color: red;
            }

            ._baz:not(#\\#)::before {
              content: "bar";
            }
          "
    `);
  });
});
