import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import nested from 'postcss-nested';
import whitespace from 'postcss-normalize-whitespace';

import { atomicifyRules } from '../atomicify-rules';

// These tests assert the collision-resistant (base-62, 11-char) output.
// The SHIPPED default is legacy 9-char — see the "legacy hash (default)"
// describe block at the bottom of this file for the default-path regression tests.
const CR = { collisionResistantHash: true } as const;

const transform = (css: TemplateStringsArray) => {
  const result = postcss([atomicifyRules(CR), whitespace(), autoprefixer()]).process(css[0], {
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

    expect(actual).toMatchInlineSnapshot(`"._1UtDYzynoA{color:blue}"`);
  });

  it('should prepend atomic class when nesting selector is prepended', () => {
    const actual = transform`
      [data-look='h100']& {
        display: block;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"[data-look='h100']._1u4z38vLZJ{display:block}"`);
  });

  it('should should atomicify multiple declarations', () => {
    const actual = transform`
      color: blue;
      font-size: 12px;
    `;

    expect(actual).toMatchInlineSnapshot(`"._1UtDYzynoA{color:blue}._4ya3eErjyG{font-size:12px}"`);
  });

  it('should autoprefix atomic rules', () => {
    process.env.BROWSERSLIST = 'Edge 16';

    const result = transform`user-select: none;`;

    expect(result).toMatchInlineSnapshot(`"._20VacPYbGa{-ms-user-select:none;user-select:none}"`);
  });

  it('should double up class selector when two nesting selectors are found', () => {
    const result = transform`
      && {
        display: block;
      }
    `;

    expect(result).toMatchInlineSnapshot(`"._1dmVT1vLZJ._1dmVT1vLZJ{display:block}"`);
  });

  it('should autoprefix atomic rules with multiple selectors', () => {
    process.env.BROWSERSLIST = 'Edge 16';

    const result = transform`
      &:hover, &:focus {
        user-select: none;
      }
    `;

    expect(result).toMatchInlineSnapshot(
      `"._2U6HNJYbGa:hover, ._3DIml2YbGa:focus{-ms-user-select:none;user-select:none}"`
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
      `"@media (min-width: 30rem){._20zuBsYbGa{-ms-user-select:none;user-select:none}}"`
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
      `"@media (min-width: 30rem){._2YOPj0YbGa div{-ms-user-select:none;user-select:none}}"`
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
      `"@media (min-width: 30rem){@media (min-width: 20rem){._20u4aWYbGa{-ms-user-select:none;user-select:none}}}"`
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
      `"@media (min-width: 30rem){@media (min-width: 20rem){@font-face{font-family:Arial;src:url(arial.woff)}._20u4aWYbGa{-ms-user-select:none;user-select:none}}}"`
    );
  });

  it('should callback with created class names', () => {
    const classes: string[] = [];
    const callback = (className: string) => {
      classes.push(className);
    };

    const result = postcss([atomicifyRules({ callback, ...CR }), whitespace()]).process(
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
        "_3iDTPbvLZJ",
        "_2fwxA5DIqT",
        "_20u4aWYbGa",
        "_09lB87YbGa",
        "_2W6fSlYbGa",
        "_0CXsCUYbGa",
      ]
    `);
  });

  it('should atomicify a nested tag with class rule', () => {
    const actual = transform`
      div.primary {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._2Ca1zwynoA div.primary{color:blue}"`);
  });

  it('should atomicify a nested multi selector rule', () => {
    const actual = transform`
      div, span, li {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(
      `"._0paDgwynoA div, ._4keetJynoA span, ._1WG9WaynoA li{color:blue}"`
    );
  });

  it('should atomicify a multi nesting pseudo rule', () => {
    // Its assumed the pseudos will get a nesting selector from the nested plugin.
    const actual = transform`
      &:hover, &:focus {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._0clgaMynoA:hover, ._10n1R5ynoA:focus{color:blue}"`);
  });

  it('should atomicify a nested tag rule', () => {
    const actual = transform`
      div {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._0paDgwynoA div{color:blue}"`);
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
      "._2MYE9XQAma._2MYE9XQAma > *{margin-bottom:1rem}
      ._4yh82wdnbC._4yh82wdnbC > *:last-child{margin-bottom:0}
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

    expect(actual).toMatchInlineSnapshot(`"._1y2rkaPFz6:first-child ._1y2rkaPFz6{color:hotpink}"`);
  });

  it('should reference the atomic class with the nesting selector', () => {
    const actual = transform`
      & :first-child {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._1HrW6EynoA :first-child{color:blue}"`);
  });

  it('should atomicify a double tag rule', () => {
    const actual = transform`
      div span {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._0yE3HpynoA div span{color:blue}"`);
  });

  it('should atomicify a double tag with pseudos rule', () => {
    const actual = transform`
      div:hover span:active {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._0ZyGvwynoA div:hover span:active{color:blue}"`);
  });

  it('should atomicify a nested tag pseudo rule', () => {
    const actual = transform`
      div:hover {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._4lsbuEynoA div:hover{color:blue}"`);
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
      `"._4lsbuEynoA div:hover{color:blue}@media screen{._0gIO46Gowl{color:red}}"`
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
    const result = postcss([nested(), atomicifyRules(CR), whitespace(), autoprefixer()]).process(
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

    expect(result.css).toMatchInlineSnapshot(`"._0t3xMurjyG div div{font-size:12px}"`);
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
      `"@container (width > 300px){._0YgYJPGowl h2{color:red}}@when font-tech(color-COLRv1) and font-tech(variations){@font-face{font-family:test;src:url(test.woff2)}}@else font-tech(color-SVG){@font-face{font-family:test;src:url(test2.woff2)}}@else{@font-face{font-family:test;src:url(test3.woff2)}}@-moz-document url-prefix(){._1LuOr6ynoA{color:blue}}@layer state{._0A5jrFjO5s{background-color:brown}}@media (min-width: 30rem){._19DmqJvLZJ{display:block}._3LVG2LSPN1{font-size:20px}}@supports selector(h2 > p){._3NEPTNy8mA{color:pink}}@starting-style{._1F7xNhJwxv{color:green}}"`
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
      `"@media (min-width: 30rem){@media (min-width: 20rem){._3Ml9egvLZJ{display:block}}}"`
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
      `"@media (min-width: 30rem){._4rhe9hvLZJ div{display:block}}"`
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
      `"@media (min-width: 30rem){@media (min-width: 20rem){._33GIuzvLZJ div{display:block}}}"`
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
      `"._1UtDYzDpLb{color:red!important}._4ya3eEXk0z{font-size:var(--font-size)!important}"`
    );
  });

  it('should generate a different hash when important flag is used', () => {
    const actual = transform`
      color: red!important;
      color: red;
    `;

    expect(actual).toMatchInlineSnapshot(
      `"._1UtDYzDpLb{color:red!important}._1UtDYzGowl{color:red}"`
    );
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

/**
 * Regression suite for the SHIPPED default behaviour.
 *
 * The `collisionResistantHash` option defaults to `false`. In that mode the
 * atomic class names MUST remain byte-for-byte identical to the historical
 * base-36, 9-character format (`_` + 4-char group + 4-char value). These tests
 * guard against accidentally changing the default output during the migration
 * period — any change here is a breaking change for every un-migrated consumer.
 *
 * The companion `collision-resistant hash (opt-in)` block asserts the new
 * base-62, 11-character format produced when the flag is enabled. Together they
 * document exactly how output differs between the two modes.
 */
describe('hash strategy', () => {
  const run = (css: string, collisionResistantHash: boolean) =>
    postcss([atomicifyRules({ collisionResistantHash }), whitespace()]).process(css, {
      from: undefined,
    }).css;

  describe('legacy hash (default, collisionResistantHash: false)', () => {
    it.each([
      ['color: red;', '_syaz5scu'],
      ['font-size: 14px;', '_1wybdlk8'],
      ['margin-top: 0;', '_19pkidpf'],
      ['color: red !important;', '_syaz1qpq'],
    ])('emits the legacy 9-char class for `%s`', (css, expected) => {
      const output = run(css, false);
      expect(output).toContain(`.${expected}`);
      // Legacy classes are always exactly 9 characters (`_` + 4 + 4).
      expect(expected).toHaveLength(9);
    });

    it('emits a legacy 9-char class for pseudo selectors', () => {
      expect(run(':hover { color: blue; }', false)).toContain('._838l13q2');
    });

    it('is the default when no option is passed', () => {
      const withoutOption = postcss([atomicifyRules(), whitespace()]).process('color: red;', {
        from: undefined,
      }).css;
      expect(withoutOption).toContain('._syaz5scu');
    });
  });

  describe('collision-resistant hash (opt-in, collisionResistantHash: true)', () => {
    it.each([
      ['color: red;', '_1UtDYzGowl'],
      ['font-size: 14px;', '_4ya3eEEbN9'],
      ['margin-top: 0;', '_313842dnbC'],
      ['color: red !important;', '_1UtDYzDpLb'],
    ])('emits the base-62 11-char class for `%s`', (css, expected) => {
      const output = run(css, true);
      expect(output).toContain(`.${expected}`);
      // Collision-resistant classes are always exactly 11 characters (`_` + 6 + 4).
      expect(expected).toHaveLength(11);
    });

    it('emits an 11-char class for pseudo selectors', () => {
      expect(run(':hover { color: blue; }', true)).toContain('._0x6viiynoA');
    });

    it('only uses base-62 characters (0-9a-zA-Z) in the hash body', () => {
      const output = run('color: red;', true);
      const className = output.match(/\.(_[0-9a-zA-Z]+)/)?.[1] ?? '';
      // No `-` or `_` in the hash body (only the leading `_` prefix is allowed).
      expect(className.slice(1)).toMatch(/^[0-9a-zA-Z]+$/);
    });
  });

  it('produces different class names for the same rule under each strategy', () => {
    expect(run('color: red;', false)).not.toEqual(run('color: red;', true));
  });
});

/**
 * Real-world collision regression tests.
 *
 * These use confirmed collision pairs identified from large production CSS bundles.
 * They document:
 *   1. That the legacy hash DOES produce group collisions on real CSS properties.
 *   2. That the collision-resistant hash eliminates those collisions.
 *
 * A "group collision" means two unrelated CSS properties share the same 4-char
 * group hash — causing ax() to silently drop one of them from the DOM.
 */
describe('real-world collision regression', () => {
  const getGroup = (cssDeclaration: string, collisionResistant: boolean): string => {
    const result = postcss([
      atomicifyRules({ collisionResistantHash: collisionResistant }),
      whitespace(),
    ]).process(cssDeclaration, { from: undefined });
    const match = result.css.match(/\.(_[0-9a-zA-Z]+)/);
    const className = match?.[1] ?? '';
    // Group = everything except the last 4 chars (value hash)
    return className.slice(0, className.length - 4);
  };

  describe('legacy hash (collisionResistantHash: false) — group collisions on real CSS properties', () => {
    it('scrollbar-width and text-anchor collide on group hash (confirmed production collision, group _1fjg)', () => {
      const groupA = getGroup('scrollbar-width: auto;', false);
      const groupB = getGroup('text-anchor: start;', false);
      // These ARE the same — this is the confirmed bug.
      expect(groupA).toBe(groupB);
      expect(groupA).toBe('_1fjg');
    });
  });

  describe('collision-resistant hash (collisionResistantHash: true) — no collisions', () => {
    it('scrollbar-width and text-anchor do NOT collide with base-62 6-char hash', () => {
      const groupA = getGroup('scrollbar-width: auto;', true);
      const groupB = getGroup('text-anchor: start;', true);
      expect(groupA).not.toBe(groupB);
    });
  });
});
