import postcss from 'postcss';
import whitespace from 'postcss-normalize-whitespace';
import autoprefixer from 'autoprefixer';
import nested from 'postcss-nested';
import { atomicifyRules } from '../atomicify-rules';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([atomicifyRules(), whitespace, autoprefixer]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('atomicify rules', () => {
  beforeEach(() => {
    process.env.BROWSERSLIST = 'last 1 version';
  });

  it('should atomicify a single declaration', () => {
    const actual = transform`
      color: blue;
    `;

    expect(actual).toMatchInlineSnapshot(`"._syaz13q2{color:blue}"`);
  });

  it('should prepend atomic class when nesting selector is prepended', () => {
    const actual = transform`
      [data-look='h100']& {
        display: block;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"[data-look='h100']._mi0g1ule{display:block}"`);
  });

  it('should should atomicify multiple declarations', () => {
    const actual = transform`
      color: blue;
      font-size: 12px;
    `;

    expect(actual).toMatchInlineSnapshot(`"._syaz13q2{color:blue}._1wyb1fwx{font-size:12px}"`);
  });

  it('should autoprefix atomic rules', () => {
    process.env.BROWSERSLIST = 'Edge 16';

    const result = transform`user-select: none;`;

    expect(result).toMatchInlineSnapshot(`"._uiztglyw{-ms-user-select:none;user-select:none}"`);
  });

  it('should double up class selector when two nesting selectors are found', () => {
    const result = transform`
      && {
        display: block;
      }
    `;

    expect(result).toMatchInlineSnapshot(`"._if291ule._if291ule{display:block}"`);
  });

  it('should autoprefix atomic rules with multiple selectors', () => {
    process.env.BROWSERSLIST = 'Edge 16';

    const result = transform`
      &:hover, &:focus {
        user-select: none;
      }
    `;

    expect(result).toMatchInlineSnapshot(
      `"._180hglyw:hover, ._1j5pglyw:focus{-ms-user-select:none;user-select:none}"`
    );
  });

  it('should autoprefix atrule atomic rules', () => {
    process.env.BROWSERSLIST = 'Edge 16';

    const result = transform`
      @media (min-width: 30rem) {
        user-select: none;
      }
    `;

    expect(result).toMatchInlineSnapshot(
      `"@media (min-width: 30rem){._ufx4glyw{-ms-user-select:none;user-select:none}}"`
    );
  });

  it('should autoprefix atrule nested atomic rules', () => {
    process.env.BROWSERSLIST = 'Edge 16';

    const result = transform`
      @media (min-width: 30rem) {
        div {
          user-select: none;
        }
      }
    `;

    expect(result).toMatchInlineSnapshot(
      `"@media (min-width: 30rem){._195xglyw div{-ms-user-select:none;user-select:none}}"`
    );
  });

  it('should autoprefix nested atrule atomic rules', () => {
    process.env.BROWSERSLIST = 'Edge 16';

    const result = transform`
      @media (min-width: 30rem) {
        @media (min-width: 20rem) {
          user-select: none;
        }
      }
    `;

    expect(result).toMatchInlineSnapshot(
      `"@media (min-width: 30rem){@media (min-width: 20rem){._uf5eglyw{-ms-user-select:none;user-select:none}}}"`
    );
  });

  it('should callback with created class names', () => {
    const classes: string[] = [];
    const callback = (className: string) => {
      classes.push(className);
    };

    const result = postcss([atomicifyRules({ callback }), whitespace]).process(
      `
        display:block;
        text-align:center;
        @media (min-width: 30rem) {
          @media (min-width: 20rem) {
            user-select: none;
          }
        }
        div, span, :hover {
          user-select: none;
        }
      `,
      {
        from: undefined,
      }
    );

    // Need to call this to fire the transformation.
    result.css;

    expect(classes).toMatchInlineSnapshot(`
      Array [
        "_1e0c1ule",
        "_y3gn1h6o",
        "_uf5eglyw",
        "_2a8pglyw",
        "_18i0glyw",
        "_9iqnglyw",
      ]
    `);
  });

  it('should atomicify a nested tag with class rule', () => {
    const actual = transform`
      div.primary {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._13ml13q2 div.primary{color:blue}"`);
  });

  it('should atomicify a nested multi selector rule', () => {
    const actual = transform`
      div, span, li {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(
      `"._65g013q2 div, ._1tjq13q2 span, ._thoc13q2 li{color:blue}"`
    );
  });

  it('should atomicify a multi nesting pseudo rule', () => {
    // Its assumed the pseudos will get a nesting selector from the nested plugin.
    const actual = transform`
      &:hover, &:focus {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._30l313q2:hover, ._f8pj13q2:focus{color:blue}"`);
  });

  it('should atomicify a nested tag rule', () => {
    const actual = transform`
      div {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._65g013q2 div{color:blue}"`);
  });

  it('should generate the same class hash for semantically same but different rules', () => {
    const firstActual = transform`
      &:first-child {
        color: blue;
      }
    `;
    const secondActual = transform`
      &:first-child {
        color: blue;
      }
    `;

    expect(firstActual).toEqual(secondActual);
  });

  it('should double up selectors when using parent selector', () => {
    const actual = transform`
      && > * {
        margin-bottom: 1rem;
      }

      && > *:last-child {
        margin-bottom: 0;
      }
    `;

    expect(actual.split('}').join('}\n')).toMatchInlineSnapshot(`
      "._169r1j6v._169r1j6v > *{margin-bottom:1rem}
      ._1wzbidpf._1wzbidpf > *:last-child{margin-bottom:0}
      "
    `);
  });

  it('should atomicify a rule when its selector has a nesting at the end', () => {
    // Its assumed the pseudos will get a nesting selector from the nested plugin.
    const actual = transform`
      &:first-child & {
        color: hotpink;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._ngwg1q9v:first-child ._ngwg1q9v{color:hotpink}"`);
  });

  it('should reference the atomic class with the nesting selector', () => {
    const actual = transform`
      & :first-child {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._prp213q2 :first-child{color:blue}"`);
  });

  it('should atomicify a double tag rule', () => {
    const actual = transform`
      div span {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._8gsp13q2 div span{color:blue}"`);
  });

  it('should atomicify a double tag with pseudos rule', () => {
    const actual = transform`
      div:hover span:active {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._f1kd13q2 div:hover span:active{color:blue}"`);
  });

  it('should atomicify a nested tag pseudo rule', () => {
    const actual = transform`
      div:hover {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._1tui13q2 div:hover{color:blue}"`);
  });

  it('should skip comments', () => {
    const actual = transform`
      /* hello world */
      div:hover {
        /* hello world */
        color: blue;
      }

      @media screen {
        /* hello world */
        color: red;
      }
    `;

    expect(actual).toMatchInlineSnapshot(
      `"._1tui13q2 div:hover{color:blue}@media screen{._43475scu{color:red}}"`
    );
  });

  it('should blow up if a doubly nested rule was found', () => {
    expect(() => {
      transform`
        div {
          div {
            font-size: 12px;
          }
        }
      `;
    }).toThrow(
      'atomicify-rules: <css input>:3:11: Nested rules need to be flattened first - run the "postcss-nested" plugin before this.'
    );
  });

  it('should not blow up if a doubly nested rule was found after nested plugin', () => {
    const result = postcss([nested, atomicifyRules(), whitespace, autoprefixer]).process(
      `
      div {
        div {
          font-size: 12px;
        }
      }
    `,
      {
        from: undefined,
      }
    );

    expect(result.css).toMatchInlineSnapshot(`"._73mn1fwx div div{font-size:12px}"`);
  });

  it('should atomicify at rule styles', () => {
    const actual = transform`
      @media (min-width: 30rem) {
        display: block;
        font-size: 20px;
      }
    `;

    expect(actual).toMatchInlineSnapshot(
      `"@media (min-width: 30rem){._hi7c1ule{display:block}._1l5zgktf{font-size:20px}}"`
    );
  });

  it('should atomicify nested at rule styles', () => {
    const actual = transform`
      @media (min-width: 30rem) {
        @media (min-width: 20rem) {
          display: block;
        }
      }
    `;

    expect(actual).toMatchInlineSnapshot(
      `"@media (min-width: 30rem){@media (min-width: 20rem){._1l9l1ule{display:block}}}"`
    );
  });

  it('should atomicify at rule nested styles', () => {
    const actual = transform`
      @media (min-width: 30rem) {
        div {
          display: block;
        }
      }
    `;

    expect(actual).toMatchInlineSnapshot(
      `"@media (min-width: 30rem){._1v9q1ule div{display:block}}"`
    );
  });

  it('should atomicify double nested at rule nested styles', () => {
    const actual = transform`
      @media (min-width: 30rem) {
        @media (min-width: 20rem) {
          div {
            display: block;
          }
        }
      }
    `;

    expect(actual).toMatchInlineSnapshot(
      `"@media (min-width: 30rem){@media (min-width: 20rem){._1acs1ule div{display:block}}}"`
    );
  });

  it('should ignore unhanded at rules', () => {
    const actual = transform`
      @charset 'utf-8';
      @import 'custom.css';
      @namespace 'XML-namespace-URL';

      @keyframes hello-world { from: { opacity: 0 } to { opacity: 1 } }
      @font-face {
        font-family: "Open Sans";
      }
    `;

    expect(actual).toMatchInlineSnapshot(
      `"@charset 'utf-8';@import 'custom.css';@namespace 'XML-namespace-URL';@-webkit-keyframes hello-world{from:{opacity:0}to{opacity:1}}@keyframes hello-world{from:{opacity:0}to{opacity:1}}@font-face{font-family:\\"Open Sans\\"}"`
    );
  });

  it('should persist important flags in CSS', () => {
    const actual = transform`
      color: red!important;
      font-size: var(--font-size) !important;
    `;

    expect(actual).toMatchInlineSnapshot(
      `"._syaz1qpq{color:red!important}._1wybit0u{font-size:var(--font-size)!important}"`
    );
  });

  it('should generate a different hash when important flag is used', () => {
    const actual = transform`
      color: red!important;
      color: red;
    `;

    expect(actual).toMatchInlineSnapshot(`"._syaz1qpq{color:red!important}._syaz5scu{color:red}"`);
  });
});
