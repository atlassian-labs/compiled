import postcss from 'postcss';

import { enforcePseudoOrder } from '../enforce-pseudo-order';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([enforcePseudoOrder()]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('enforce pseudo-selector order plugin', () => {
  it('should ignore non-prefixed class names', () => {
    const actual = transform`.foo {}`;

    expect(actual).toMatchInlineSnapshot(`".foo {}"`);
  });

  it('should ignore class names not containing pseudo-selectors', () => {
    const actual = transform`._foo {}`;

    expect(actual).toMatchInlineSnapshot(`"._foo {}"`);
  });

  it('should ignore class names not containing the pseudo-selectors we care about', () => {
    const actual = transform`._foo:before {}`;

    expect(actual).toMatchInlineSnapshot(`"._foo:before {}"`);
  });

  it('should increase specicifity of the pseudo-selectors included in our `lvfha` ordering', () => {
    const actual = transform`
      ._foo {}
      ._foo:link {}
      ._foo:visited {}
      ._foo:focus-within {}
      ._foo:focus {}
      ._foo:focus-visible {}
      ._foo:hover {}
      ._foo:active {}
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
            ._foo {}
            ._foo:link {}
            ._foo:visited:not(#\\#) {}
            ._foo:focus-within:not(#\\##\\#) {}
            ._foo:focus:not(#\\##\\##\\#) {}
            ._foo:focus-visible:not(#\\##\\##\\##\\#) {}
            ._foo:hover:not(#\\##\\##\\##\\##\\#) {}
            ._foo:active:not(#\\##\\##\\##\\##\\##\\#) {}
          "
    `);
  });

  it('should ignore at-rules', () => {
    const actual = transform`
      @media {
        ._foo:hover {}
      }
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
            @media {
              ._foo:hover:not(#\\##\\##\\##\\##\\#) {}
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

  it('should ignore existing :not() selectors', () => {
    const actual = transform`
      ._foo:not(#\\#) {
        color: blue;
      }

      ._foo:not(#\\#):hover {
        color: green;
      }

      ._foo:hover:not(#\\#) {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
            ._foo:not(#\\#) {
              color: blue;
            }

            ._foo:not(#\\#):hover:not(#\\##\\##\\##\\##\\#) {
              color: green;
            }

            ._foo:hover:not(#\\#):not(#\\##\\##\\##\\##\\#) {
              color: blue;
            }
          "
    `);
  });

  it('should handle several selectors', () => {
    const actual = transform`
      ._foo:hover:active, ._foo:active, ._baz:focus {
        color: red;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
            ._foo:hover:active:not(#\\##\\##\\##\\##\\##\\#), ._foo:active:not(#\\##\\##\\##\\##\\##\\#), ._baz:focus:not(#\\##\\##\\#) {
              color: red;
            }
          "
    `);
  });

  it('should use the last pseudo-selector encountered', () => {
    const actual = transform`
      ._foo:hover:active {
        color: red;
      }

      ._baz::before:active {
        content: "bar";
      }

      ._baz:active::before {
        content: "boo";
      }
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
            ._foo:hover:active:not(#\\##\\##\\##\\##\\##\\#) {
              color: red;
            }

            ._baz::before:active:not(#\\##\\##\\##\\##\\##\\#) {
              content: "bar";
            }

            ._baz:active::before:not(#\\##\\##\\##\\##\\##\\#) {
              content: "boo";
            }
          "
    `);
  });
});
