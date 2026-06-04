import { transformCss as transform } from '../transform';
import type { LocalTransformOptions, TransformOpts } from '../transform';

const defaultOpts: TransformOpts = { optimizeCss: false };
const transformCss = (
  code: string,
  opts: TransformOpts = defaultOpts,
  localOpts: LocalTransformOptions = {}
) => transform(code, opts, localOpts);

describe('#css-transform', () => {
  it('should generate the same selectors even if white space is different', () => {
    const { sheets: actualOne } = transformCss(`
      >   :first-child {
        color: red;
      }
    `);
    const { sheets: actualTwo } = transformCss(`
      >:first-child{
        color: red;
      }
    `);

    expect(actualOne.join('\n')).toEqual(actualTwo.join('\n'));
  });

  it('should generate the same at-rules even if white space is different', () => {
    const { sheets: actualOne } = transformCss(`
      @media (max-width:   400px)  and    (min-width: 10px) {
        color: red;
      }
    `);
    const { sheets: actualTwo } = transformCss(`
      @media (max-width:400px) and (min-width:10px){
        color: red;
      }
    `);

    expect(actualOne.join('\n')).toEqual(actualTwo.join('\n'));
  });

  describe('leading pseudo in css', () => {
    it('should parent a single pseudo', () => {
      const { sheets: actual } = transformCss(
        `
      :focus {
        color: hotpink;
      }
    `
      );

      expect(actual.join('\n')).toMatchInlineSnapshot(`"._f8pj1q9v:focus{color:hotpink}"`);
    });

    it('should discard duplicates', () => {
      const { sheets: actual } = transformCss(
        `
      display: block;
      display: flex;
    `
      );

      expect(actual.join('\n')).toMatchInlineSnapshot(`"._1e0c1txw{display:flex}"`);
    });

    it('should not reparent when parent has a combinator', () => {
      const { sheets: actual } = transformCss(
        `
      && > * {
        margin-bottom: 1rem;

        &:last-child {
          margin-bottom: 0;
        }
      }
    `
      );

      expect(actual.join('\n')).toMatchInlineSnapshot(`
        "._1xhg1j6v._1xhg1j6v>*{margin-bottom:1rem}
        ._1ym1idpf._1ym1idpf>:last-child{margin-bottom:0}"
      `);
    });

    it('should parent multiple pseduos in a group', () => {
      const { sheets: actual } = transformCss(
        `
      :hover div,
      :focus {
        color: hotpink;
      }
    `
      );

      expect(actual.join('\n')).toMatchInlineSnapshot(`
        "._f8pj1q9v:focus{color:hotpink}
        ._1sfm1q9v:hover div{color:hotpink}"
      `);
    });

    it('should parent multiple pseudos in a group in a group of multiple', () => {
      const { sheets: actual } = transformCss(
        `
      .foo,
      .bar div,
      .qwe {
        :first-child,
        div,
        span,
        :last-child {
          color: hotpink;
        }
      }
    `
      );

      expect(actual.join('\n').split(',').join(',\n')).toMatchInlineSnapshot(`
        "._kq2v1q9v .bar div div{color:hotpink}
        ._11eb1q9v .bar div span{color:hotpink}
        ._1sbr1q9v .bar div:first-child{color:hotpink}
        ._15h31q9v .bar div:last-child{color:hotpink}
        ._ppxs1q9v .foo div{color:hotpink}
        ._1fa31q9v .foo span{color:hotpink}
        ._t7rc1q9v .foo:first-child{color:hotpink}
        ._1pdx1q9v .foo:last-child{color:hotpink}
        ._1z9o1q9v .qwe div{color:hotpink}
        ._1qid1q9v .qwe span{color:hotpink}
        ._1g8a1q9v .qwe:first-child{color:hotpink}
        ._1j9g1q9v .qwe:last-child{color:hotpink}"
      `);
    });

    it('should parent a complex pseudo', () => {
      const { sheets: actual } = transformCss(
        `
      :nth-child(3) {
        color: hotpink;
      }
    `
      );

      expect(actual.join('\n')).toMatchInlineSnapshot(`"._2pem1q9v:nth-child(3){color:hotpink}"`);
    });

    it('should parent overlapping psuedos', () => {
      const { sheets: actual } = transformCss(
        `
      & :first-child {
        :first-child {
          color: hotpink;
        }
      }
    `
      );

      expect(actual.join('\n')).toMatchInlineSnapshot(
        `"._1kys1q9v :first-child:first-child{color:hotpink}"`
      );
    });

    it('should parent overlapping pseudos that are reversed', () => {
      const { sheets: actual } = transformCss(
        `
      & :first-child {
        :first-child & {
          color: hotpink;
        }
      }
    `
      );

      expect(actual.join('\n')).toMatchInlineSnapshot(
        `"._99g41q9v :first-child:first-child ._99g41q9v :first-child{color:hotpink}"`
      );
    });

    it('should parent pseudos in nested atrules', () => {
      const { sheets: actual } = transformCss(
        `
      @media (max-width: 400px) {
        @supports (display: grid) {
          div,
          :first-child {
            color: hotpink;
          }
        }
      }
    `
      );

      expect(actual.join('\n')).toMatchInlineSnapshot(
        `"@media (max-width:400px){@supports (display:grid){._jbdf1q9v:first-child{color:hotpink}._ex911q9v div{color:hotpink}}}"`
      );
    });

    it('should ignore pseduos with leading selectors', () => {
      const { sheets: actual } = transformCss(
        `
      > :first-child {
        color: hotpink;
      }
    `
      );

      expect(actual.join('\n')).toMatchInlineSnapshot(`"._129w1q9v >:first-child{color:hotpink}"`);
    });
  });

  it('should not affect the output css if theres nothing to do', () => {
    const { sheets: actual } = transformCss(
      `
      div {
        color: hotpink;
      }
    `
    );

    expect(actual.join('\n')).toMatchInlineSnapshot(`"._65g01q9v div{color:hotpink}"`);
  });

  it('should ignore parsing a data attribute selector with a comma in it', () => {
    const { sheets: actual } = transformCss(
      `
      [data-foo=","] {
        color: hotpink;
      }
    `
    );

    expect(actual.join('\n')).toMatchInlineSnapshot(`"._qofj1q9v [data-foo=","]{color:hotpink}"`);
  });

  it('should not build charset rules when minifying', () => {
    const { sheets: actual } = transformCss(
      `
      position: relative;
      text-transform: capitalize;

      :after {
        content: "›";
        position: absolute;
        right: -2rem;
      }
    `
    );

    expect(actual.join('\n')).toMatchInlineSnapshot(`
      "._kqswh2mm{position:relative}
      ._1p1d1dk0{text-transform:capitalize}
      ._aetr16l8:after{content:"›"}
      ._18postnw:after{position:absolute}
      ._32rxlgv5:after{right:-2rem}"
    `);
  });

  it('should return all generated class names', () => {
    const { classNames } = transformCss(
      `
      position: relative;
      text-transform: capitalize;

      :after {
        content: "›";
        position: absolute;
        right: -2rem;
      }
    `
    );

    expect(classNames).toMatchInlineSnapshot(`
      [
        "_kqswh2mm",
        "_1p1d1dk0",
        "_aetr16l8",
        "_18postnw",
        "_32rxlgv5",
      ]
    `);
  });

  it('should sort pseudo class inside media query based on lvfha ordering', () => {
    const { sheets: actual } = transformCss(`
      @media (max-width: 400px) {
        :active, :link { color: red; }
        :focus { color: pink; }
        :hover { color: green; }
        :focus-visible { color: white; }
        :visited { color: black; }
        :link { color: yellow; }
        :focus-within { color: grey; }
      }
    `);

    expect(actual.join('\n')).toMatchInlineSnapshot(
      `"@media (max-width:400px){._buol1gy6:link{color:yellow}._st8p11x8:visited{color:black}._4h7jtwqo:focus-within{color:grey}._6i6132ev:focus{color:pink}._is8y1x77:focus-visible{color:white}._axlybf54:hover{color:green}._1i6q5scu:active{color:red}._buol5scu:link{color:red}}"`
    );
  });

  it('should persist important flags', () => {
    const { sheets: actual } = transformCss(`
      color: red !important;
    `);

    expect(actual.join('')).toMatchInlineSnapshot(`"._syaz1qpq{color:red!important}"`);
  });

  it('shouldnt blow up when expanding', () => {
    const actual = transformCss(`
      flex: 1;
    `);

    expect(actual.sheets.join('')).toMatchInlineSnapshot(
      `"._16jlkb7n{flex-grow:1}._1o9zkb7n{flex-shrink:1}._i0dlf1ug{flex-basis:0%}"`
    );
  });

  describe('browserslist options', () => {
    afterEach(() => {
      delete process.env.BROWSERSLIST;
      delete process.env.AUTOPREFIXER_GRID;
    });

    it('should generate prefixes for default', () => {
      const { sheets: actual } = transformCss(
        `
        div {
          user-select: none;
        }
        `
      );

      expect(actual.join('')).toMatchInlineSnapshot(
        `"._2a8pglyw div{-webkit-user-select:none;-moz-user-select:none;user-select:none}"`
      );
    });

    it('should generate prefixes for ms', () => {
      process.env.BROWSERSLIST = 'Edge 16';

      const { sheets: actual } = transformCss(
        `
        div {
          user-select: none;
        }
        `
      );

      expect(actual.join('')).toMatchInlineSnapshot(
        `"._2a8pglyw div{-ms-user-select:none;user-select:none}"`
      );
    });

    it('should not generate any prefixes', () => {
      process.env.BROWSERSLIST = 'Chrome 78';

      const { sheets: actual } = transformCss(
        `
        div {
          user-select: none;
        }
        `
      );

      expect(actual.join('')).toMatchInlineSnapshot(`"._2a8pglyw div{user-select:none}"`);
    });

    it('should generate ms prefixes for grid', () => {
      process.env.BROWSERSLIST = 'IE 10';
      process.env.AUTOPREFIXER_GRID = 'autoplace';

      const { sheets: actual } = transformCss(
        `
        div {
          display: grid;
        }
        `
      );

      expect(actual.join('')).toMatchInlineSnapshot(
        `"._tkqh11p5 div{display:-ms-grid;display:grid}"`
      );
    });
  });

  describe('should apply all the cssnano plugins', () => {
    it('should order values', () => {
      const { sheets: actualOne } = transformCss(
        `
        border: green solid 2px;
      `,
        { ...defaultOpts, optimizeCss: true }
      );
      const { sheets: actualTwo } = transformCss(
        `
        border: 2px solid green;
      `,
        { ...defaultOpts, optimizeCss: true }
      );

      expect(actualOne.join('\n')).toEqual(actualTwo.join('\n'));
    });

    it('should normalize values', () => {
      const { sheets: actual } = transformCss(
        `
        margin-left: initial;
        content: 'hello';
        color: rebeccapurple;
        border-color: currentColor;
        background-color: currentcolor;
        border-left-color: current-color;

      `,
        { ...defaultOpts, optimizeCss: true }
      );

      expect(actual.join('\n')).toMatchInlineSnapshot(`
        "._1h6d1r31{border-color:currentColor}
        ._18u0idpf{margin-left:0}
        ._1sb21e8g{content:"hello"}
        ._syaz15td{color:#639}
        ._bfhk1r31{background-color:currentColor}
        ._5wra1r31{border-left-color:currentColor}"
      `);
    });

    it('should normalize empty values', () => {
      const { sheets: actual } = transformCss(
        `
        margin-left: initial;
        margin-top: 0px;
        margin-bottom: 0;
      `,
        { ...defaultOpts, optimizeCss: true }
      );

      expect(actual.join('\n')).toMatchInlineSnapshot(`
        "._18u0idpf{margin-left:0}
        ._19pkidpf{margin-top:0}
        ._otyridpf{margin-bottom:0}"
      `);
    });
  });

  it('should add extra specificity after atomicizing without affecting class names', () => {
    const styles = `
      padding: 8px;
      color: red;
      :before {
        content: var(--hello-world);
        margin-right: 8px;
        color: pink;
      }
    `;
    const actual = transformCss(styles, { increaseSpecificity: true });
    const expected = transformCss(styles, { increaseSpecificity: false });

    expect(actual.classNames).toEqual(expected.classNames);
  });

  describe('increased specificity', () => {
    it('should add extra specificity to declarations', () => {
      const styles = `
        padding: 8px;
        color: red;
        :before {
          content: var(--hello-world);
          margin-right: 8px;
          color: pink;
        }
        ::after {
          color: red;
        }
      `;
      const { sheets: actual } = transformCss(styles, { increaseSpecificity: true });

      expect(actual.join('\n')).toMatchInlineSnapshot(`
        "._ca0qftgi:not(#\\#){padding-top:8px}
        ._u5f3ftgi:not(#\\#){padding-right:8px}
        ._n3tdftgi:not(#\\#){padding-bottom:8px}
        ._19bvftgi:not(#\\#){padding-left:8px}
        ._syaz5scu:not(#\\#){color:red}
        ._1kt9o5oc:not(#\\#):before{content:var(--hello-world)}
        ._eid3ftgi:not(#\\#):before{margin-right:8px}
        ._is0632ev:not(#\\#):before{color:pink}
        ._14rn5scu:not(#\\#):after{color:red}"
      `);
    });

    it('should increase & selector specificity', () => {
      const styles = `
        div & { color: red; }
        div:hover & { color: red; }
        div &:hover { color: red; }
      `;
      const { sheets: actual } = transformCss(styles, { increaseSpecificity: true });

      expect(actual.join('\n')).toMatchInlineSnapshot(`
        "div ._kqan5scu:not(#\\#){color:red}
        div:hover ._12hc5scu:not(#\\#){color:red}
        div ._wntz5scu:not(#\\#):hover{color:red}"
      `);
    });
  });

  describe('selectors with combinators', () => {
    it('should handle descendent selectors', () => {
      const { sheets: actual } = transformCss(`div span { color: red; font-weight: bold; }`);

      expect(actual.join('\n')).toMatchInlineSnapshot(`
        "._8gsp5scu div span{color:red}
        ._1w0n8n31 div span{font-weight:bold}"
      `);
    });

    it('should use enhanced hash strategy (base-62 slice(-4)) for more hash space', () => {
      const { sheets: actual } = transformCss(
        `div span { color: red; font-weight: bold; }`,
        {},
        { hashStrategy: 'enhanced' }
      );

      // enhanced strategy: base-62 with slice(-4) — 8.8× more hash space, same 9-char shape
      expect(actual).toHaveLength(2);
      // Class names use base-62 (may include uppercase letters)
      actual.forEach((sheet) => {
        expect(sheet).toMatch(/^\._[a-zA-Z0-9]{8} div span\{/);
      });
    });

    it('should use max hash strategy (full base-62 6-char group) for cross-package collision safety', () => {
      const { sheets: actual } = transformCss(
        `div span { color: red; font-weight: bold; }`,
        {},
        { hashStrategy: 'max' }
      );

      // max strategy: full 32-bit base-62 group (6 chars) + 4-char value = 11-char classes
      expect(actual).toHaveLength(2);
      actual.forEach((sheet) => {
        expect(sheet).toMatch(/^\._[a-zA-Z0-9]{10} div span\{/);
      });
    });

    it('should honor classHashPrefix when using hashStrategy', () => {
      const { sheets: actual } = transformCss(
        `div span { color: red; font-weight: bold; }`,
        {
          classHashPrefix: 'myprefix',
        },
        { hashStrategy: 'enhanced' }
      );

      // enhanced strategy: classHashPrefix should change the class name
      expect(actual.join('\n')).not.toContain('._5scu');
      expect(actual).toHaveLength(2);
    });

    it('should apply classNameCompressionMap when using hashStrategy', () => {
      // First, generate without compression to discover the class names.
      const { sheets: baseline } = transformCss(
        `div span { color: red; }`,
        {},
        { hashStrategy: 'enhanced' }
      );

      // Extract the original class name.
      const match = baseline[0].match(/\._([^\s{]+)/);
      const originalClass = match![1];

      // Build a compression map that maps the original class to a short alias.
      const compressionMap: Record<string, string> = {
        [originalClass]: 'cx',
      };

      const { sheets: compressed } = transformCss(
        `div span { color: red; }`,
        { classNameCompressionMap: compressionMap },
        { hashStrategy: 'enhanced' }
      );

      expect(compressed.join('\n')).toBe('.cx div span{color:red}');
    });

    it('should work with sortShorthand when using hashStrategy', () => {
      const { sheets: actual } = transformCss(
        `div span { padding: 8px; padding-top: 4px; color: red; }`,
        { sortShorthand: true },
        { hashStrategy: 'enhanced' }
      );

      // sortShorthand expands padding shorthand — all declarations are still atomic
      expect(actual).toHaveLength(6);
      actual.forEach((sheet) => expect(sheet).toContain('div span'));
    });

    it('should preserve !important when using hashStrategy', () => {
      const { sheets: actual } = transformCss(
        `div span { color: red !important; font-weight: bold; }`,
        {},
        { hashStrategy: 'enhanced' }
      );

      expect(actual.join('\n')).toContain('color:red!important');
      expect(actual.join('\n')).toContain('font-weight:bold');
    });

    it('should produce distinct class names for different combinator selector rules', () => {
      const { sheets: actual } = transformCss(
        `
        div span { color: red; font-weight: bold; }
        div > span { color: red; font-weight: bold; }
        `,
        {},
        { hashStrategy: 'enhanced' }
      );

      // Different selectors → different group hashes
      expect(actual).toHaveLength(4);
      const classNames = actual.map((s) => s.match(/\._([a-zA-Z0-9]+)/)?.[1]);
      expect(classNames[0]).not.toBe(classNames[2]);
    });

    it('should sort rules by pseudo-class order when using hashStrategy', () => {
      const { sheets: actual } = transformCss(
        `
        div span:hover { color: red; font-weight: bold; }
        div span:focus { color: blue; font-weight: normal; }
        `,
        {},
        { hashStrategy: 'enhanced' }
      );

      expect(actual.join('\n')).toMatchInlineSnapshot(`
        "._jmK1ynoA div span:focus{color:blue}
        ._40uZzUZr div span:focus{font-weight:normal}
        ._qCGyGowl div span:hover{color:red}
        ._mFlYmmCn div span:hover{font-weight:bold}"
      `);
    });
  });

  describe('flatten multiple selectors', () => {
    it('should flatten multiple selectors when configured (by default)', () => {
      const { sheets: actual } = transformCss(`div, span { color: red; }`);

      expect(actual.join('\n')).toMatchInlineSnapshot(`
        "._65g05scu div{color:red}
        ._1tjq5scu span{color:red}"
      `);
    });

    it('should not flatten multiple selectors when disabled', () => {
      const { sheets: actual } = transformCss(`div, span { color: red; }`, {
        ...defaultOpts,
        flattenMultipleSelectors: false,
      });

      expect(actual.join('\n')).toMatchInlineSnapshot(
        `"._65g05scu div, ._1tjq5scu span{color:red}"`
      );
    });

    it('should deduplicate flattened selectors', () => {
      const { sheets: actual } = transformCss(`
        div, div {
          color: red;
        }
        div {
          color: red;
        }
        &:hover { color: blue ;}
        &:hover, &:focus { color: blue ;}
      `);

      // WARNING: This does not actually work, but it could.
      expect(actual.join('\n')).toMatchInlineSnapshot(`
        "._65g05scu div{color:red}
        ._65g05scu div{color:red}
        ._65g05scu div{color:red}
        ._30l313q2:hover{color:blue}
        ._f8pj13q2:focus{color:blue}
        ._30l313q2:hover{color:blue}"
      `);
    });
  });
});
