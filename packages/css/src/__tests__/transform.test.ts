import { transformCss as transform } from '../transform';
import type { LocalTransformOptions, TransformOpts } from '../transform';

// Tests assert collision-resistant (base-62, 11-char) output. Shipped default is
// legacy 9-char — see the legacy regression suite in atomicify-rules.test.ts.
const defaultOpts: TransformOpts = { optimizeCss: false, collisionResistantHash: true };
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

      expect(actual.join('\n')).toMatchInlineSnapshot(`"._10n1R5PFz6:focus{color:hotpink}"`);
    });

    it('should discard duplicates', () => {
      const { sheets: actual } = transformCss(
        `
      display: block;
      display: flex;
    `
      );

      expect(actual.join('\n')).toMatchInlineSnapshot(`"._3iDTPbQ4SZ{display:flex}"`);
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
        "._4Al40FQAma._4Al40FQAma>*{margin-bottom:1rem}
        ._4EX0l2dnbC._4EX0l2dnbC>:last-child{margin-bottom:0}"
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
        "._10n1R5PFz6:focus{color:hotpink}
        ._4fFwuWPFz6:hover div{color:hotpink}"
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
        "._1mNZJXPFz6 .bar div div{color:hotpink}
        ._2t28KTPFz6 .bar div span{color:hotpink}
        ._4femD1PFz6 .bar div:first-child{color:hotpink}
        ._2JIvyJPFz6 .bar div:last-child{color:hotpink}
        ._1Hfy9BPFz6 .foo div{color:hotpink}
        ._3nQn6lPFz6 .foo span{color:hotpink}
        ._1VygW3PFz6 .foo:first-child{color:hotpink}
        ._43cvTGPFz6 .foo:last-child{color:hotpink}
        ._086gvoPFz6 .qwe div{color:hotpink}
        ._47NrSpPFz6 .qwe span{color:hotpink}
        ._3rJiwhPFz6 .qwe:first-child{color:hotpink}
        ._3E8EPdPFz6 .qwe:last-child{color:hotpink}"
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

      expect(actual.join('\n')).toMatchInlineSnapshot(`"._0b4tcXPFz6:nth-child(3){color:hotpink}"`);
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
        `"._3L6ZVVPFz6 :first-child:first-child{color:hotpink}"`
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
        `"._0BTYbJPFz6 :first-child:first-child ._0BTYbJPFz6 :first-child{color:hotpink}"`
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
        `"@media (max-width:400px){@supports (display:grid){._1h2DG1PFz6:first-child{color:hotpink}._0Z4h9yPFz6 div{color:hotpink}}}"`
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

      expect(actual.join('\n')).toMatchInlineSnapshot(
        `"._2wCOKjPFz6 >:first-child{color:hotpink}"`
      );
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

    expect(actual.join('\n')).toMatchInlineSnapshot(`"._0paDgwPFz6 div{color:hotpink}"`);
  });

  it('should ignore parsing a data attribute selector with a comma in it', () => {
    const { sheets: actual } = transformCss(
      `
      [data-foo=","] {
        color: hotpink;
      }
    `
    );

    expect(actual.join('\n')).toMatchInlineSnapshot(`"._1LaDEBPFz6 [data-foo=","]{color:hotpink}"`);
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
      "._1mT5xdRAKS{position:relative}
      ._41LZZBMRGa{text-transform:capitalize}
      ._0GBAIrhvWj:after{content:"›"}
      ._2WYcYGWVPG:after{position:absolute}
      ._0cAGM7QLor:after{right:-2rem}"
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
        "_1mT5xdRAKS",
        "_41LZZBMRGa",
        "_0GBAIrhvWj",
        "_2WYcYGWVPG",
        "_0cAGM7QLor",
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
      `"@media (max-width:400px){._0Mv35WFQV5:link{color:yellow}._1TTXvZbqW0:visited{color:black}._0ik7zDokCM:focus-within{color:grey}._0qCirsy8mA:focus{color:pink}._1eRRpIaJpK:focus-visible{color:white}._0IJXWLJwxv:hover{color:green}._3zJNtiGowl:active{color:red}._0Mv35WGowl:link{color:red}}"`
    );
  });

  it('should persist important flags', () => {
    const { sheets: actual } = transformCss(`
      color: red !important;
    `);

    expect(actual.join('')).toMatchInlineSnapshot(`"._1UtDYzDpLb{color:red!important}"`);
  });

  it('shouldnt blow up when expanding', () => {
    const actual = transformCss(`
      flex: 1;
    `);

    expect(actual.sheets.join('')).toMatchInlineSnapshot(
      `"._2O5Vij7dHp{flex-grow:1}._3YEZNO7dHp{flex-shrink:1}._1bHrqEAEMG{flex-basis:0%}"`
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
        `"._09lB87YbGa div{-webkit-user-select:none;-moz-user-select:none;user-select:none}"`
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
        `"._09lB87YbGa div{-ms-user-select:none;user-select:none}"`
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

      expect(actual.join('')).toMatchInlineSnapshot(`"._09lB87YbGa div{user-select:none}"`);
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
        `"._1X1ILOgBM8 div{display:-ms-grid;display:grid}"`
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
        "._3vBAKH98eZ{border-color:currentColor}
        ._2XsHFMdnbC{margin-left:0}
        ._4f9mo4z2Y9{content:"hello"}
        ._1UtDYz7dn1{color:#639}
        ._0KLXru98eZ{background-color:currentColor}
        ._0obpEh98eZ{border-left-color:currentColor}"
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
        "._2XsHFMdnbC{margin-left:0}
        ._313842dnbC{margin-top:0}
        ._1DCdHidnbC{margin-bottom:0}"
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
    const actual = transformCss(styles, {
      increaseSpecificity: true,
      collisionResistantHash: true,
    });
    const expected = transformCss(styles, {
      increaseSpecificity: false,
      collisionResistantHash: true,
    });

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
      const { sheets: actual } = transformCss(styles, {
        increaseSpecificity: true,
        collisionResistantHash: true,
      });

      expect(actual.join('\n')).toMatchInlineSnapshot(`
        "._0Of8r2Jg58:not(#\\#){padding-top:8px}
        ._1ZnuxbJg58:not(#\\#){padding-right:8px}
        ._1wydGWJg58:not(#\\#){padding-bottom:8px}
        ._2Zuz6QJg58:not(#\\#){padding-left:8px}
        ._1UtDYzGowl:not(#\\#){color:red}
        ._3Ku51IR2z5:not(#\\#):before{content:var(--hello-world)}
        ._0Xnm3eJg58:not(#\\#):before{margin-right:8px}
        ._1eQ8NNy8mA:not(#\\#):before{color:pink}
        ._2GPglyGowl:not(#\\#):after{color:red}"
      `);
    });

    it('should increase & selector specificity', () => {
      const styles = `
        div & { color: red; }
        div:hover & { color: red; }
        div &:hover { color: red; }
      `;
      const { sheets: actual } = transformCss(styles, {
        increaseSpecificity: true,
        collisionResistantHash: true,
      });

      expect(actual.join('\n')).toMatchInlineSnapshot(`
        "div ._1mPw0cGowl:not(#\\#){color:red}
        div:hover ._2xt8pnGowl:not(#\\#){color:red}
        div ._29EGgJGowl:not(#\\#):hover{color:red}"
      `);
    });
  });

  describe('selectors with combinators', () => {
    it('should handle descendent selectors', () => {
      const { sheets: actual } = transformCss(`div span { color: red; font-weight: bold; }`);

      expect(actual.join('\n')).toMatchInlineSnapshot(`
        "._0yE3HpGowl div span{color:red}
        ._4ukO8GmmCn div span{font-weight:bold}"
      `);
    });

    it('should produce distinct class names for different combinator selector rules', () => {
      const { sheets: actual } = transformCss(
        `
        div span { color: red; font-weight: bold; }
        div > span { color: red; font-weight: bold; }
        `
      );

      // Different selectors → different group hashes
      expect(actual).toHaveLength(4);
      const classNames = actual.map((s) => s.match(/\._([a-zA-Z0-9]+)/)?.[1]);
      expect(classNames[0]).not.toBe(classNames[2]);
    });

    it('should transform css to non-atomic output (used by cssMapScoped)', () => {
      const { sheets, classNames } = transformCss(
        `div span { color: red; font-weight: bold; }`,
        {},
        { nonAtomic: true }
      );

      // Non-atomic: a single sheet wrapping all declarations under one class
      expect(classNames).toHaveLength(1);
      expect(classNames[0]).toMatch(/^cc-[a-z0-9]+$/);
      // No `_` prefix — not an atomic class
      expect(classNames[0]).not.toMatch(/^_/);
      // Both declarations are present in the CSS
      expect(sheets.join('\n')).toContain('color:red');
      expect(sheets.join('\n')).toContain('font-weight:bold');
      // Both declarations are scoped under the single class
      sheets.forEach((sheet) => expect(sheet).toContain(`.${classNames[0]}`));
    });

    it('should produce stable non-atomic class names (content-addressable)', () => {
      const css = `div span { color: red; }`;
      const { classNames: first } = transformCss(css, {}, { nonAtomic: true });
      const { classNames: second } = transformCss(css, {}, { nonAtomic: true });
      expect(first[0]).toBe(second[0]);
    });

    it('should produce distinct non-atomic class names for different CSS content', () => {
      const { classNames: a } = transformCss(`div { color: red; }`, {}, { nonAtomic: true });
      const { classNames: b } = transformCss(`div { color: blue; }`, {}, { nonAtomic: true });
      expect(a[0]).not.toBe(b[0]);
    });
  });

  describe('flatten multiple selectors', () => {
    it('should flatten multiple selectors when configured (by default)', () => {
      const { sheets: actual } = transformCss(`div, span { color: red; }`);

      expect(actual.join('\n')).toMatchInlineSnapshot(`
        "._0paDgwGowl div{color:red}
        ._4keetJGowl span{color:red}"
      `);
    });

    it('should not flatten multiple selectors when disabled', () => {
      const { sheets: actual } = transformCss(`div, span { color: red; }`, {
        ...defaultOpts,
        flattenMultipleSelectors: false,
      });

      expect(actual.join('\n')).toMatchInlineSnapshot(
        `"._0paDgwGowl div, ._4keetJGowl span{color:red}"`
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
        "._0paDgwGowl div{color:red}
        ._0paDgwGowl div{color:red}
        ._0paDgwGowl div{color:red}
        ._0clgaMynoA:hover{color:blue}
        ._10n1R5ynoA:focus{color:blue}
        ._0clgaMynoA:hover{color:blue}"
      `);
    });
  });
});
