/**
 * @jest-environment node
 */

import { transform as lightningcss } from 'lightningcss';

import { atomicifyRules } from '../atomicify-rules';

describe('atomicify rules', () => {
  let callback: () => void;
  const transform = (css: string) => {
    callback = jest.fn();

    const { code } = lightningcss({
      code: Buffer.from(css),
      drafts: {
        nesting: true,
      },
      filename: 'styles.css',
      visitor: atomicifyRules({ callback }),
    });

    return code.toString().trim();
  };

  it('should atomicify a single declaration', () => {
    expect(
      transform(`
        & {
          color: blue;
        }
      `)
    ).toMatchInlineSnapshot(`
      "._21dd1aoa {
        color: #00f;
      }"
    `);
  });

  it('should prepend atomic class when nesting selector is prepended', () => {
    expect(
      transform(`
        [data-look='h100']& {
          display: block;
        }
      `)
    ).toMatchInlineSnapshot(`
      "[data-look="h100"]._1h58a7h6 {
        display: block;
      }"
    `);
  });

  it('should should atomicify multiple declarations', () => {
    expect(
      transform(`
        & {
          color: blue;
          font-size: 12px;
        }
      `)
    ).toMatchInlineSnapshot(`
      "._21dd1aoa {
        color: #00f;
      }

      ._1vi41qzj {
        font-size: 12px;
      }"
    `);
  });

  it.skip('should autoprefix atomic rules', () => {
    process.env.BROWSERSLIST = 'Edge 16';

    expect(transform(`& { user-select: none; }`)).toMatchInlineSnapshot(
      `"._uiztglyw{-ms-user-select:none;user-select:none}"`
    );
  });

  it('should double up class selector when two nesting selectors are found', () => {
    expect(
      transform(`
        && {
          display: block;
        }
      `)
    ).toMatchInlineSnapshot(`
      "._1h7pa7h6._1h7pa7h6 {
        display: block;
      }"
    `);
  });

  it.skip('should autoprefix atomic rules with multiple selectors', () => {
    process.env.BROWSERSLIST = 'Edge 16';

    expect(
      transform(`
        &:hover, &:focus {
          user-select: none;
        }
      `)
    ).toMatchInlineSnapshot(
      `"._180hglyw:hover, ._1j5pglyw:focus{-ms-user-select:none;user-select:none}"`
    );
  });

  it.skip('should autoprefix atrule atomic rules', () => {
    process.env.BROWSERSLIST = 'Edge 16';

    expect(
      transform(`
        @media (min-width: 30rem) {
          user-select: none;
        }
      `)
    ).toMatchInlineSnapshot(
      `"@media (min-width: 30rem){._ufx4glyw{-ms-user-select:none;user-select:none}}"`
    );
  });

  it.skip('should autoprefix atrule nested atomic rules', () => {
    process.env.BROWSERSLIST = 'Edge 16';

    expect(
      transform(`
        @media (min-width: 30rem) {
          div {
            user-select: none;
          }
        }
      `)
    ).toMatchInlineSnapshot(
      `"@media (min-width: 30rem){._195xglyw div{-ms-user-select:none;user-select:none}}"`
    );
  });

  it.skip('should autoprefix nested atrule atomic rules', () => {
    process.env.BROWSERSLIST = 'Edge 16';

    expect(
      transform(`
        @media (min-width: 30rem) {
          @media (min-width: 20rem) {
            user-select: none;
          }
        }
      `)
    ).toMatchInlineSnapshot(
      `"@media (min-width: 30rem){@media (min-width: 20rem){._uf5eglyw{-ms-user-select:none;user-select:none}}}"`
    );

    expect(
      transform(`
        @media (min-width: 30rem) {
          @media (min-width: 20rem) {
            @font-face { font-family: Arial; src: url(arial.woff); }
            user-select: none;
          }
        }
      `)
    ).toMatchInlineSnapshot(
      `"@media (min-width: 30rem){@media (min-width: 20rem){@font-face{font-family:Arial;src:url(arial.woff)}._uf5eglyw{-ms-user-select:none;user-select:none}}}"`
    );
  });

  it('should callback with created class names', () => {
    transform(`
      @media (min-width: 30rem) {
        @media (min-width: 20rem) {
          & {
            user-select: none;
          }
        }
      }

      & {
        display:block;
        text-align:center;
      }

      & div, & span, &:hover {
        user-select: none;
      }
    `);

    expect(callback).toHaveBeenCalledTimes(6);

    for (const className of [
      '_12vqokba',
      '_1i78a7h6',
      '_12td7tl9',
      '_1p7qokba',
      '_u0cuokba',
      '_u3p2okba',
    ]) {
      expect(callback).toHaveBeenCalledWith(className);
    }
  });

  it('should atomicify a nested tag with class rule', () => {
    expect(
      transform(`
        & div.primary {
          color: blue;
        }
      `)
    ).toMatchInlineSnapshot(`
      "._qfvg1aoa div.primary {
        color: #00f;
      }"
    `);
  });

  it('should atomicify a nested multi selector rule', () => {
    expect(
      transform(`
        & div, & span, & li {
          color: blue;
        }
      `)
    ).toMatchInlineSnapshot(`
      "._1a7l1aoa div, ._1idu1aoa span, ._lqzw1aoa li {
        color: #00f;
      }"
    `);
  });

  it('should atomicify a multi nesting pseudo rule', () => {
    // Its assumed the pseudos will get a nesting selector from the nested plugin.
    expect(
      transform(`
        &:hover, &:focus {
          color: blue;
        }
      `)
    ).toMatchInlineSnapshot(`
      "._6gew1aoa:hover, ._1vyi1aoa:focus {
        color: #00f;
      }"
    `);
  });

  it('should atomicify a nested tag rule', () => {
    expect(
      transform(`
        & div {
          color: blue;
        }
      `)
    ).toMatchInlineSnapshot(`
      "._1a7l1aoa div {
        color: #00f;
      }"
    `);
  });

  it('should generate the same class hash for semantically same but different rules', () => {
    expect(
      transform(`
        &:first-child {
          color: blue;
        }
      `)
    ).toEqual(
      transform(`
        &:first-child {
          color: blue;
        }
      `)
    );
  });

  it('should double up selectors when using parent selector', () => {
    expect(
      transform(`
        && > * {
          margin-bottom: 1rem;
        }

        && > *:last-child {
          margin-bottom: 0;
        }
      `)
    ).toMatchInlineSnapshot(`
      "._lzp21bgj._lzp21bgj > * {
        margin-bottom: 1rem;
      }

      ._h4h41wyd._h4h41wyd > :last-child {
        margin-bottom: 0;
      }"
    `);
  });

  it('should atomicify a rule when its selector has a nesting at the end', () => {
    // Its assumed the pseudos will get a nesting selector from the nested plugin.
    expect(
      transform(`
        &:first-child & {
          color: hotpink;
        }
      `)
    ).toMatchInlineSnapshot(`
      "._15871w91:first-child ._15871w91 {
        color: #ff69b4;
      }"
    `);
  });

  it('should reference the atomic class with the nesting selector', () => {
    expect(
      transform(`
        & :first-child {
          color: blue;
        }
      `)
    ).toMatchInlineSnapshot(`
      "._bj7z1aoa :first-child {
        color: #00f;
      }"
    `);
  });

  it('should atomicify a double tag rule', () => {
    expect(
      transform(`
        & div span {
          color: blue;
        }
      `)
    ).toMatchInlineSnapshot(`
      "._17ru1aoa div span {
        color: #00f;
      }"
    `);
  });

  it('should atomicify a double tag with pseudos rule', () => {
    expect(
      transform(`
        & div:hover span:active {
          color: blue;
        }
      `)
    ).toMatchInlineSnapshot(`
      "._1av01aoa div:hover span:active {
        color: #00f;
      }"
    `);
  });

  it('should atomicify a nested tag pseudo rule', () => {
    expect(
      transform(`
        & div:hover {
          color: blue;
        }
      `)
    ).toMatchInlineSnapshot(`
      "._1gyw1aoa div:hover {
        color: #00f;
      }"
    `);
  });

  it('should skip comments', () => {
    expect(
      transform(`
        /* hello world */
        & div:hover {
          /* hello world */
          color: blue;
        }

        @media screen {
          & {
            /* hello world */
            color: red;
          }
        }
      `)
    ).toMatchInlineSnapshot(`
      "._1gyw1aoa div:hover {
        color: #00f;
      }

      @media screen {
        ._21dd9928 {
          color: red;
        }
      }"
    `);
  });

  it('should handle doubly nested rule', () => {
    expect(
      transform(`
        div {
          & div {
            font-size: 12px;
          }
        }
      `)
    ).toMatchInlineSnapshot(`
      "._1dit1qzj div div {
        font-size: 12px;
      }"
    `);
  });

  it('should atomicify at-rule styles', () => {
    expect(
      transform(`
        @container (width > 300px) {
          & h2 { color: red; }
        }

        @when font-tech(color-COLRv1) and font-tech(variations) {
          @font-face { font-family: test; src: url(test.woff2); }
        }

        @else font-tech(color-SVG) {
          @font-face { font-family: test; src: url(test2.woff2); }
        }

        @else {
          @font-face { font-family: test; src: url(test3.woff2); }
        }

        @-moz-document url-prefix() {
          & {
            color: blue;
          }
        }

        @layer state {
          & {
            background-color: brown;
          }
        }

        @media (min-width: 30rem) {
          & {
            display: block;
            font-size: 20px;
          }
        }

        @supports selector(h2 > p) {
          & {
            color: pink;
          }
        }
    `)
    ).toMatchInlineSnapshot(`
      "@container (width > 300px) {
        ._1en19928 h2 {
          color: red;
        }
      }

      @when font-tech(color-COLRv1) and font-tech(variations) {
        @font-face { font-family: test; src: url("test.woff2"); }
      }

      @else font-tech(color-SVG) {
        @font-face { font-family: test; src: url("test2.woff2"); }
      }

      @else {
        @font-face { font-family: test; src: url("test3.woff2"); }
      }

      @-moz-document url-prefix() {
        ._21dd1aoa {
          color: #00f;
        }
      }

      @layer state {
        ._19qxmwkg {
          background-color: brown;
        }
      }

      @media (width >= 30rem) {
        ._1i78a7h6 {
          display: block;
        }

        ._1vi48xkx {
          font-size: 20px;
        }
      }

      @supports selector(h2 > p) {
        ._21ddklub {
          color: pink;
        }
      }"
    `);
  });

  it('should atomicify nested at-rule styles', () => {
    expect(
      transform(`
        @media (min-width: 30rem) {
          @media (min-width: 20rem) {
            & {
              display: block;
            }
          }
        }
      `)
    ).toMatchInlineSnapshot(`
      "@media (width >= 30rem) {
        @media (width >= 20rem) {
          ._1i78a7h6 {
            display: block;
          }
        }
      }"
    `);
  });

  // TODO
  it('should atomicify at-rule nested styles', () => {
    expect(
      transform(`
        @media (min-width: 30rem) {
          & div {
            & span {
              display: block;
            }
          }
        }
      `)
    ).toMatchInlineSnapshot(`
      "@media (width >= 30rem) {
        ._hdy4a7h6 ._hdy4a7h6 div span {
          display: block;
        }
      }"
    `);
  });

  it('should atomicify double nested at-rule nested styles', () => {
    expect(
      transform(`
        @media (min-width: 30rem) {
          @media (min-width: 20rem) {
            & div {
              display: block;
            }
          }
        }
      `)
    ).toMatchInlineSnapshot(`
      "@media (width >= 30rem) {
        @media (width >= 20rem) {
          ._1n9ua7h6 div {
            display: block;
          }
        }
      }"
    `);
  });

  it('should ignore at-rules that cannot be atomicized but do make sense to be used', () => {
    expect(
      transform(`
        @color-profile --swop5c {
          src: url('https://example.org/SWOP2006_Coated5v2.icc');
        }

        @counter-style triangle {
          system: cyclic;
          symbols: ‣;
          suffix: " ";
        }

        @font-face { font-family: "Open Sans"; }

        @font-palette-values --FontPalette {
          font-family: "Open Sans";
          base-palette: 1;
        }

        @keyframes hello-world { from: { opacity: 0 } to { opacity: 1 } }

        @page :left { margin-top: 4in; }

        @property --radius {
          syntax: "<length>";
          inherits: false;
          initial-value: 0px;
        }
      `)
    ).toMatchInlineSnapshot(`
      "@color-profile --swop5c {
        src: url("https://example.org/SWOP2006_Coated5v2.icc");
      }

      @counter-style triangle {
        system: cyclic;
        symbols: ‣;
        suffix: " ";
      }

      @font-face {
        font-family: Open Sans;
      }

      @font-palette-values --FontPalette {
        font-family: Open Sans;
        base-palette: 1;
      }

      @keyframes hello-world {
        to {
          opacity: 1;
        }
      }

      @page :left {
        margin-top: 4in;
      }

      @property --radius {
        syntax: "<length>";
        inherits: false;
        initial-value: 0;
      }"
    `);
  });

  it('should persist important flags in CSS', () => {
    expect(
      transform(`
        color: red!important;
        font-size: var(--font-size) !important;
      `)
    ).toMatchInlineSnapshot(
      `"._syaz1qpq{color:red!important}._1wybit0u{font-size:var(--font-size)!important}"`
    );
  });

  it('should generate a different hash when important flag is used', () => {
    expect(
      transform(`
        color: red!important;
        color: red;
      `)
    ).toMatchInlineSnapshot(`"._syaz1qpq{color:red!important}._syaz5scu{color:red}"`);
  });

  it('should throw an error for unknown at-rules', () => {
    expect(() =>
      transform(`
        @asdfghjkl state {
          div { color: blue; }
          .hello { font-size: 1px; }
        }
      `)
    ).toThrow("Unknown at-rule '@asdfghjkl'.");

    expect(() =>
      transform(`
        @media screen {
          @asdfghjkl { color: blue; }
          .hello { font-size: 1px; }
        }
      `)
    ).toThrow("Unknown at-rule '@asdfghjkl'.");
  });
});
