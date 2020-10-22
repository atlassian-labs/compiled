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

    expect(actual).toMatchInlineSnapshot(`"._1doq13q2{color:blue}"`);
  });

  it('should should atomicify multiple declarations', () => {
    const actual = transform`
      color: blue;
      font-size: 12px;
    `;

    expect(actual).toMatchInlineSnapshot(`"._1doq13q2{color:blue}._36l61fwx{font-size:12px}"`);
  });

  it('should autoprefix atomic rules', () => {
    process.env.BROWSERSLIST = 'Edge 16';

    const result = transform`user-select: none;`;

    expect(result).toMatchInlineSnapshot(`"._q4hxglyw{-ms-user-select:none;user-select:none}"`);
  });

  it('should double up class selector when two nesting selectors are found', () => {
    const result = transform`
      && {
        display: block;
      }
    `;

    expect(result).toMatchInlineSnapshot(`"._1e0c1ule._1e0c1ule{display:block}"`);
  });

  it('should autoprefix atomic rules with multiple selectors', () => {
    process.env.BROWSERSLIST = 'Edge 16';

    const result = transform`
      :hover, :focus {
        user-select: none;
      }
    `;

    expect(result).toMatchInlineSnapshot(
      `"._1tclglyw:hover, ._16wpglyw:focus{-ms-user-select:none;user-select:none}"`
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
      `"@media (min-width: 30rem){._3r8kglyw{-ms-user-select:none;user-select:none}}"`
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
      `"@media (min-width: 30rem){._1a7jglyw div{-ms-user-select:none;user-select:none}}"`
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
      `"@media (min-width: 30rem){@media (min-width: 20rem){._1cg4glyw{-ms-user-select:none;user-select:none}}}"`
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
        "_dj7i1ule",
        "_o3nk1h6o",
        "_1cg4glyw",
        "_1qcvglyw",
        "_1uoyglyw",
        "_1tclglyw",
      ]
    `);
  });

  it('should atomicify a nested tag with class rule', () => {
    const actual = transform`
      div.primary {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._yjs513q2 div.primary{color:blue}"`);
  });

  it('should atomicify a nested multi selector rule', () => {
    const actual = transform`
      div, span, li {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(
      `"._k2hc13q2 div, ._ijgx13q2 span, ._1jah13q2 li{color:blue}"`
    );
  });

  it('should atomicify a multi dangling pseudo rule', () => {
    const actual = transform`
      :hover, :focus {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._1uhh13q2:hover, ._t5gl13q2:focus{color:blue}"`);
  });

  it('should atomicify a nested tag rule', () => {
    const actual = transform`
      div {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._k2hc13q2 div{color:blue}"`);
  });

  it('should generate the same class hash for semantically same but different rules', () => {
    const firstActual = transform`
      &:first-child {
        color: blue;
      }
    `;
    const secondActual = transform`
      :first-child {
        color: blue;
      }
    `;

    const expected = '._roi113q2:first-child{color:blue}';
    expect(firstActual).toEqual(expected);
    expect(secondActual).toEqual(expected);
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
      "._14rh1j6v._14rh1j6v > *{margin-bottom:1rem}
      ._it8pidpf._it8pidpf > *:last-child{margin-bottom:0}
      "
    `);
  });

  it('should atomicify a rule when its selector has a nesting at the end', () => {
    const actual = transform`
      :first-child & {
        color: hotpink;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._1qab1q9v:first-child ._1qab1q9v{color:hotpink}"`);
  });

  it('should reference the atomic class with the nesting selector', () => {
    const actual = transform`
      & :first-child {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._p9sj13q2 :first-child{color:blue}"`);
  });

  it('should atomicify a double tag rule', () => {
    const actual = transform`
      div span {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._m59i13q2 div span{color:blue}"`);
  });

  it('should atomicify a double tag with pseudos rule', () => {
    const actual = transform`
      div:hover span:active {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._107g13q2 div:hover span:active{color:blue}"`);
  });

  it('should atomicify a nested tag pseudo rule', () => {
    const actual = transform`
      div:hover {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._5tvz13q2 div:hover{color:blue}"`);
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
      `"._5tvz13q2 div:hover{color:blue}@media screen{._gli45scu{color:red}}"`
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

    expect(result.css).toMatchInlineSnapshot(`"._1qan1fwx div div{font-size:12px}"`);
  });

  it('should atomicify at rule styles', () => {
    const actual = transform`
      @media (min-width: 30rem) {
        display: block;
        font-size: 20px;
      }
    `;

    expect(actual).toMatchInlineSnapshot(
      `"@media (min-width: 30rem){._1ie31ule{display:block}._4ubngktf{font-size:20px}}"`
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
      `"@media (min-width: 30rem){@media (min-width: 20rem){._16pr1ule{display:block}}}"`
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
      `"@media (min-width: 30rem){._166e1ule div{display:block}}"`
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
      `"@media (min-width: 30rem){@media (min-width: 20rem){._15ac1ule div{display:block}}}"`
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
});
