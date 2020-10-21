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

    expect(actual.join('\n')).toMatchInlineSnapshot(`"._t5gl1q9v:focus{color:hotpink}"`);
  });

  it('should double up selectors when using parent selector', () => {
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
      "._14rh1j6v._14rh1j6v > *{margin-bottom:1rem}
      ._it8pidpf._it8pidpf > *:last-child{margin-bottom:0}"
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
      `"._g1wc1q9v:hover div, ._t5gl1q9v:focus{color:hotpink}"`
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
      "._774z1q9v .foo:first-child,
       ._1uu81q9v .foo div,
       ._1t8r1q9v .foo span,
       ._bucf1q9v .foo:last-child,
       ._1j3t1q9v .bar div:first-child,
       ._1dnx1q9v .bar div div,
       ._t68y1q9v .bar div span,
       ._3gpd1q9v .bar div:last-child,
       ._9hpv1q9v .qwe:first-child,
       ._uu4h1q9v .qwe div,
       ._1u2l1q9v .qwe span,
       ._11e01q9v .qwe:last-child{color:hotpink}"
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

    expect(actual.join('\n')).toMatchInlineSnapshot(`"._19mq1q9v:nth-child(3){color:hotpink}"`);
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
      `"._v39b1q9v :first-child:first-child{color:hotpink}"`
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
      `"._1aks1q9v :first-child:first-child ._1aks1q9v :first-child{color:hotpink}"`
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
      `"@media (max-width: 400px){@supports (display: grid){._1bnp1q9v div, ._zqtk1q9v:first-child{color:hotpink}}}"`
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

    expect(actual.join('\n')).toMatchInlineSnapshot(`"._12t41q9v >:first-child{color:hotpink}"`);
  });

  it('should not affect the output css if theres nothing to do', () => {
    const { sheets: actual } = transformCss(
      `
      div {
        color: hotpink;
      }
    `
    );

    expect(actual.join('\n')).toMatchInlineSnapshot(`"._k2hc1q9v div{color:hotpink}"`);
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
      `"._1j3i1q9v [data-foo=\\",\\"]{color:hotpink}"`
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
      "._1rvbh2mm{position:relative}
      ._v8ua1dk0{text-transform:capitalize}
      ._ehmw16l8:after{content:\\"›\\"}
      ._1a4astnw:after{position:absolute}
      ._og13lgv5:after{right:-2rem}"
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
        "_1rvbh2mm",
        "_v8ua1dk0",
        "_ehmw16l8",
        "_1a4astnw",
        "_og13lgv5",
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
        `"._1qcvglyw div{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}"`
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
        `"._1qcvglyw div{-ms-user-select:none;user-select:none}"`
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
      expect(actual.join('')).toMatchInlineSnapshot(`"._1qcvglyw div{user-select:none}"`);
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
        `"._fz6y11p5 div{display:-ms-grid;display:grid}"`
      );
    });
  });
});
