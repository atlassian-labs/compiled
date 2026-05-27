import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import nested from 'postcss-nested';
import whitespace from 'postcss-normalize-whitespace';

import { atomicifyRules } from '../atomicify-rules';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([atomicifyRules(), whitespace(), autoprefixer()]).process(css[0], {
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

    expect(actual).toMatchInlineSnapshot(`"._tDYzynoA{color:blue}"`);
  });

  it('should prepend atomic class when nesting selector is prepended', () => {
    const actual = transform`
      [data-look='h100']& {
        display: block;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"[data-look='h100']._4z38vLZJ{display:block}"`);
  });

  it('should should atomicify multiple declarations', () => {
    const actual = transform`
      color: blue;
      font-size: 12px;
    `;

    expect(actual).toMatchInlineSnapshot(`"._tDYzynoA{color:blue}._a3eErjyG{font-size:12px}"`);
  });

  it('should autoprefix atomic rules', () => {
    process.env.BROWSERSLIST = 'Edge 16';

    const result = transform`user-select: none;`;

    expect(result).toMatchInlineSnapshot(`"._VacPYbGa{-ms-user-select:none;user-select:none}"`);
  });

  it('should double up class selector when two nesting selectors are found', () => {
    const result = transform`
      && {
        display: block;
      }
    `;

    expect(result).toMatchInlineSnapshot(`"._mVT1vLZJ._mVT1vLZJ{display:block}"`);
  });

  it('should autoprefix atomic rules with multiple selectors', () => {
    process.env.BROWSERSLIST = 'Edge 16';

    const result = transform`
      &:hover, &:focus {
        user-select: none;
      }
    `;

    expect(result).toMatchInlineSnapshot(
      `"._6HNJYbGa:hover, ._Iml2YbGa:focus{-ms-user-select:none;user-select:none}"`
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
      `"@media (min-width: 30rem){._zuBsYbGa{-ms-user-select:none;user-select:none}}"`
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
      `"@media (min-width: 30rem){._OPj0YbGa div{-ms-user-select:none;user-select:none}}"`
    );
  });

  it('should autoprefix nested atrule atomic rules', () => {
    process.env.BROWSERSLIST = 'Edge 16';

    const result1 = transform`
      @media (min-width: 30rem) {
        @media (min-width: 20rem) {
          user-select: none;
        }
      }
    `;

    expect(result1).toMatchInlineSnapshot(
      `"@media (min-width: 30rem){@media (min-width: 20rem){._u4aWYbGa{-ms-user-select:none;user-select:none}}}"`
    );

    const result2 = transform`
      @media (min-width: 30rem) {
        @media (min-width: 20rem) {
          @font-face { font-family: Arial; src: url(arial.woff); }
          user-select: none;
        }
      }
    `;

    expect(result2).toMatchInlineSnapshot(
      `"@media (min-width: 30rem){@media (min-width: 20rem){@font-face{font-family:Arial;src:url(arial.woff)}._u4aWYbGa{-ms-user-select:none;user-select:none}}}"`
    );
  });

  it('should callback with created class names', () => {
    const classes: string[] = [];
    const callback = (className: string) => {
      classes.push(className);
    };

    const result = postcss([atomicifyRules({ callback }), whitespace()]).process(
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
      [
        "_DTPbvLZJ",
        "_wxA5DIqT",
        "_u4aWYbGa",
        "_lB87YbGa",
        "_6fSlYbGa",
        "_XsCUYbGa",
      ]
    `);
  });

  it('should atomicify a nested tag with class rule', () => {
    const actual = transform`
      div.primary {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._a1zwynoA div.primary{color:blue}"`);
  });

  it('should atomicify a nested multi selector rule', () => {
    const actual = transform`
      div, span, li {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(
      `"._aDgwynoA div, ._eetJynoA span, ._G9WaynoA li{color:blue}"`
    );
  });

  it('should atomicify a multi nesting pseudo rule', () => {
    // Its assumed the pseudos will get a nesting selector from the nested plugin.
    const actual = transform`
      &:hover, &:focus {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._lgaMynoA:hover, ._n1R5ynoA:focus{color:blue}"`);
  });

  it('should atomicify a nested tag rule', () => {
    const actual = transform`
      div {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._aDgwynoA div{color:blue}"`);
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
      "._YE9XQAma._YE9XQAma > *{margin-bottom:1rem}
      ._h82wdnbC._h82wdnbC > *:last-child{margin-bottom:0}
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

    expect(actual).toMatchInlineSnapshot(`"._2rkaPFz6:first-child ._2rkaPFz6{color:hotpink}"`);
  });

  it('should reference the atomic class with the nesting selector', () => {
    const actual = transform`
      & :first-child {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._rW6EynoA :first-child{color:blue}"`);
  });

  it('should atomicify a double tag rule', () => {
    const actual = transform`
      div span {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._E3HpynoA div span{color:blue}"`);
  });

  it('should atomicify a double tag with pseudos rule', () => {
    const actual = transform`
      div:hover span:active {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._yGvwynoA div:hover span:active{color:blue}"`);
  });

  it('should atomicify a nested tag pseudo rule', () => {
    const actual = transform`
      div:hover {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._sbuEynoA div:hover{color:blue}"`);
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
      `"._sbuEynoA div:hover{color:blue}@media screen{._IO46Gowl{color:red}}"`
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
    const result = postcss([nested(), atomicifyRules(), whitespace(), autoprefixer()]).process(
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

    expect(result.css).toMatchInlineSnapshot(`"._3xMurjyG div div{font-size:12px}"`);
  });

  it('should atomicify at-rule styles', () => {
    const actual = transform`
      @container (width > 300px) {
        h2 { color: red; }
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
        color: blue;
      }

      @layer state {
        background-color: brown;
      }

      @media (min-width: 30rem) {
        display: block;
        font-size: 20px;
      }

      @supports selector(h2 > p) {
        color: pink;
      }

      @starting-style {
        color: green;
      }
    `;

    expect(actual).toMatchInlineSnapshot(
      `"@container (width > 300px){._gYJPGowl h2{color:red}}@when font-tech(color-COLRv1) and font-tech(variations){@font-face{font-family:test;src:url(test.woff2)}}@else font-tech(color-SVG){@font-face{font-family:test;src:url(test2.woff2)}}@else{@font-face{font-family:test;src:url(test3.woff2)}}@-moz-document url-prefix(){._uOr6ynoA{color:blue}}@layer state{._5jrFjO5s{background-color:brown}}@media (min-width: 30rem){._DmqJvLZJ{display:block}._VG2LSPN1{font-size:20px}}@supports selector(h2 > p){._EPTNy8mA{color:pink}}@starting-style{._7xNhJwxv{color:green}}"`
    );
  });

  it('should atomicify nested at-rule styles', () => {
    const actual = transform`
      @media (min-width: 30rem) {
        @media (min-width: 20rem) {
          display: block;
        }
      }
    `;

    expect(actual).toMatchInlineSnapshot(
      `"@media (min-width: 30rem){@media (min-width: 20rem){._l9egvLZJ{display:block}}}"`
    );
  });

  it('should atomicify at-rule nested styles', () => {
    const actual = transform`
      @media (min-width: 30rem) {
        div {
          display: block;
        }
      }
    `;

    expect(actual).toMatchInlineSnapshot(
      `"@media (min-width: 30rem){._he9hvLZJ div{display:block}}"`
    );
  });

  it('should atomicify double nested at-rule nested styles', () => {
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
      `"@media (min-width: 30rem){@media (min-width: 20rem){._GIuzvLZJ div{display:block}}}"`
    );
  });

  it("should raise an error for at-rules that cannot be atomicized and don't make sense to be used", () => {
    expect(() => transform`@charset 'utf-8';`).toThrow(
      "At-rule '@charset' cannot be used in CSS rules."
    );

    expect(() => transform`@import 'custom.css';`).toThrow(
      "At-rule '@import' cannot be used in CSS rules."
    );

    expect(() => transform`@namespace 'XML-namespace-URL';`).toThrow(
      "At-rule '@namespace' cannot be used in CSS rules."
    );
  });

  it('should ignore at-rules that cannot be atomicized but do make sense to be used', () => {
    const actual = transform`
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

      @position-try --top {
        position-area: top;
        margin-bottom: 10px;
      }

      @property --radius {
        syntax: "<length>";
        inherits: false;
        initial-value: 0px;
      }
    `;

    expect(actual).toMatchInlineSnapshot(
      `"@color-profile --swop5c{src:url('https://example.org/SWOP2006_Coated5v2.icc')}@counter-style triangle{system:cyclic;symbols:‣;suffix:" "}@font-face{font-family:"Open Sans"}@font-palette-values --FontPalette{font-family:"Open Sans";base-palette:1}@-webkit-keyframes hello-world{from:{opacity:0}to{opacity:1}}@keyframes hello-world{from:{opacity:0}to{opacity:1}}@page :left{margin-top:4in}@position-try --top{position-area:top;margin-bottom:10px}@property --radius{syntax:"<length>";inherits:false;initial-value:0px}"`
    );
  });

  it('should persist important flags in CSS', () => {
    const actual = transform`
      color: red!important;
      font-size: var(--font-size) !important;
    `;

    expect(actual).toMatchInlineSnapshot(
      `"._tDYzDpLb{color:red!important}._a3eEXk0z{font-size:var(--font-size)!important}"`
    );
  });

  it('should generate a different hash when important flag is used', () => {
    const actual = transform`
      color: red!important;
      color: red;
    `;

    expect(actual).toMatchInlineSnapshot(`"._tDYzDpLb{color:red!important}._tDYzGowl{color:red}"`);
  });

  describe('class name collision detection', () => {
    it('should generate different class names for top-level and child-selector properties that collide with short hash', () => {
      // Regression test: group hash collision between
      //   top-level prop "margin-top"  (group hash input: "undefined&margin-top")
      //   "& li" rule   "flex-shrink"  (group hash input: "undefined& liflex-shrink")
      // Both produce group hash "19pk" when sliced to 4 chars from the murmurhash2 output,
      // causing both to compile to "_19pkyh40" when value is "2px".
      // The ax() runtime uses the group prefix to deduplicate classes, so a collision
      // silently causes one property to clobber the other at runtime.
      const snippetA = transform`
        margin-top: 2px;
      `;
      const snippetB = transform`
        & li { flex-shrink: 2px; }
      `;

      const classA = snippetA.match(/\._[a-zA-Z0-9]+/)?.[0];
      const classB = snippetB.match(/\._[a-zA-Z0-9]+/)?.[0];

      // Both class names must exist
      expect(classA).toBeDefined();
      expect(classB).toBeDefined();

      // They must be different — same class name means ax() will incorrectly
      // treat "margin-top" and "flex-shrink" as the same CSS property axis
      expect(classA).not.toEqual(classB);
    });

    it('should generate different class names for the same value across different property+selector combos', () => {
      // A broader check: collect all atomic class names generated from a realistic
      // set of property/selector combinations that share the same value ("2px").
      // None of them should collide, because each represents a distinct CSS axis.
      const inputs = [
        transform`margin-top: 2px;`,
        transform`& li { flex-shrink: 2px; }`,
        transform`outline-width: 2px;`,
        transform`padding-bottom: 2px;`,
        transform`border-bottom: 2px;`,
        transform`width: 2px;`,
        transform`& > span { padding-bottom: 2px; }`,
        transform`& > span { outline-width: 2px; }`,
        transform`& div { width: 2px; }`,
        transform`& > span { border-bottom: 2px; }`,
      ];

      const classNames = inputs.map((css) => css.match(/\._[a-zA-Z0-9]+/)?.[0]);
      const unique = new Set(classNames);

      // Every input must produce a unique class name
      expect(unique.size).toEqual(classNames.length);
    });

    it('should generate different group hashes for visually distinct property axes', () => {
      // Verify the group portion (first 4 chars after the leading _) is unique
      // per logical CSS axis (selector + property combination).
      // Two different axes sharing the same group hash causes silent style override bugs.
      const cases = [
        { css: transform`margin-top: 2px;`, label: '& | margin-top' },
        { css: transform`& li { flex-shrink: 2px; }`, label: '& li | flex-shrink' },
        { css: transform`outline-width: 2px;`, label: '& | outline-width' },
        { css: transform`padding-bottom: 2px;`, label: '& | padding-bottom' },
        { css: transform`border-bottom: 2px;`, label: '& | border-bottom' },
        { css: transform`& > span { padding-bottom: 2px; }`, label: '& > span | padding-bottom' },
        { css: transform`& div { width: 2px; }`, label: '& div | width' },
      ];

      // Extract just the group portion: "_GGGGVVVV" -> "GGGG"
      const groups = cases.map(({ css, label }) => {
        const className = css.match(/\._([a-zA-Z0-9]{4})[a-zA-Z0-9]{4}/)?.[1];
        return { label, group: className };
      });

      const groupValues = groups.map((g) => g.group);
      const uniqueGroups = new Set(groupValues);

      // Each CSS axis must have a unique group hash
      if (uniqueGroups.size !== groupValues.length) {
        const collisionReport = `Group hash collisions detected:\n${groups
          .map((g) => `  ${g.group} <- ${g.label}`)
          .join('\n')}`;
        throw new Error(collisionReport);
      }
    });
  });

  it('should throw an error for unknown at-rules', () => {
    expect(
      () => transform`
      @asdfghjkl state {
        div { color: blue; }
        .hello { font-size: 1px; }
      }
    `
    ).toThrow("Unknown at-rule '@asdfghjkl'.");

    expect(
      () => transform`
      @media screen {
        @asdfghjkl { color: blue; }
        .hello { font-size: 1px; }
      }
    `
    ).toThrow("Unknown at-rule '@asdfghjkl'.");
  });
});
