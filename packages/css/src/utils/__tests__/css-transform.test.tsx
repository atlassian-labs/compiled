import { transformCss } from '../css-transform';

describe('leading pseduos in css', () => {
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
      "._169r1j6v._169r1j6v > *{margin-bottom:1rem}
      ._1wzbidpf._1wzbidpf > *:last-child{margin-bottom:0}"
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

    expect(actual.join('\n')).toMatchInlineSnapshot(
      `"._1sfm1q9v:hover div, ._f8pj1q9v:focus{color:hotpink}"`
    );
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
      "._t7rc1q9v .foo:first-child,
       ._ppxs1q9v .foo div,
       ._1fa31q9v .foo span,
       ._1pdx1q9v .foo:last-child,
       ._1sbr1q9v .bar div:first-child,
       ._kq2v1q9v .bar div div,
       ._11eb1q9v .bar div span,
       ._15h31q9v .bar div:last-child,
       ._1g8a1q9v .qwe:first-child,
       ._1z9o1q9v .qwe div,
       ._1qid1q9v .qwe span,
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
      `"@media (max-width: 400px){@supports (display: grid){._1vye1q9v div, ._18e01q9v:first-child{color:hotpink}}}"`
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

    expect(actual.join('\n')).toMatchInlineSnapshot(`"._19601q9v > :first-child{color:hotpink}"`);
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

    expect(actual.join('\n')).toMatchInlineSnapshot(
      `"._qofj1q9v [data-foo=\\",\\"]{color:hotpink}"`
    );
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
    `,
      { minify: true }
    );

    expect(actual.join('\n')).toMatchInlineSnapshot(`
      "._kqswh2mm{position:relative}
      ._1p1d1dk0{text-transform:capitalize}
      ._aetr16l8:after{content:\\"›\\"}
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
      Array [
        "_kqswh2mm",
        "_1p1d1dk0",
        "_aetr16l8",
        "_18postnw",
        "_32rxlgv5",
      ]
    `);
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
        `"._2a8pglyw div{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}"`
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
});
