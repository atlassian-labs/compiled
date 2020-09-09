import { transformCss } from '../css-transform';

describe('css transform', () => {
  xit('should parent a single pseudo', () => {
    const actual = transformCss(
      `
      :focus {
        color: hotpink;
      }
    `
    );

    expect(actual.sheets.join('\n')).toMatchInlineSnapshot(`".cls:focus{color:hotpink}"`);
  });

  xit('should parent multiple pseduos in a group', () => {
    const actual = transformCss(
      `
      :hover div,
      :focus {
        color: hotpink;
      }
    `
    );

    expect(actual.sheets.join('\n')).toMatchInlineSnapshot(`
      ".cls:hover div,
      .cls:focus{color:hotpink}"
    `);
  });

  xit('should parent multiple pseudos in a group in a group of multiple', () => {
    const actual = transformCss(
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

    expect(actual.sheets.join('\n')).toMatchInlineSnapshot(`
      ".cls .foo:first-child,
      .cls .foo div,
      .cls .foo span,
      .cls .foo:last-child,
      .cls .bar div:first-child,
      .cls .bar div div,
      .cls .bar div span,
      .cls .bar div:last-child,
      .cls .qwe:first-child,
      .cls .qwe div,
      .cls .qwe span,
      .cls .qwe:last-child{color:hotpink}"
    `);
  });

  xit('should parent a complex pseudo', () => {
    const actual = transformCss(
      `
      :nth-child(3) {
        color: hotpink;
      }
    `
    );

    expect(actual.sheets.join('\n')).toMatchInlineSnapshot(`".cls:nth-child(3){color:hotpink}"`);
  });

  xit('should parent overlapping psuedos', () => {
    const actual = transformCss(
      `
      & :first-child {
        :first-child {
          color: hotpink;
        }
      }
    `
    );

    expect(actual.sheets.join('\n')).toMatchInlineSnapshot(
      `".cls :first-child:first-child{color:hotpink}"`
    );
  });

  xit('should parent overlapping pseudos that are reversed', () => {
    const actual = transformCss(
      `
      & :first-child {
        :first-child & {
          color: hotpink;
        }
      }
    `
    );

    expect(actual.sheets.join('\n')).toMatchInlineSnapshot(
      `".cls :first-child:first-child .cls :first-child{color:hotpink}"`
    );
  });

  xit('should parent pseudos in nested atrules', () => {
    const actual = transformCss(
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

    expect(actual.sheets.join('\n')).toMatchInlineSnapshot(`
      "@media (max-width: 400px){@supports (display: grid){.cls div,
      .cls:first-child{color:hotpink}}}"
    `);
  });

  it('should ignore pseduos with leading selectors', () => {
    const actual = transformCss(
      `
      > :first-child {
        color: hotpink;
      }
    `
    );

    expect(actual.sheets.join('\n')).toMatchInlineSnapshot(`
      ".cc-1s8iw5j-1q9vtd8 >:first-child{
          color:hotpink}"
    `);
  });

  it('should not affect the output css if theres nothing to do', () => {
    const actual = transformCss(
      `
      div {
        color: hotpink;
      }
    `
    );

    expect(actual.sheets.join('\n')).toMatchInlineSnapshot(`
      ".cc-yzwmj6-1q9vtd8 div{
          color:hotpink}"
    `);
  });

  it('should ignore parsing a data attribute selector with a comma in it', () => {
    const actual = transformCss(
      `
      [data-foo=","] {
        color: hotpink;
      }
    `
    );

    expect(actual.sheets.join('\n')).toMatchInlineSnapshot(`
      ".cc-1fuddz3-1q9vtd8 [data-foo=\\",\\"]{
          color:hotpink}"
    `);
  });

  it('should not build charset rules when minifying', () => {
    const actual = transformCss(
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

    expect(actual.sheets.join('\n')).toMatchInlineSnapshot(`
      ".cc-v5rl1c-h2mmj6{position:relative}
      .cc-cy1bws-1dk0nxm{text-transform:capitalize}
      .cc-1aqc269-16l8ovn:after{content:\\"›\\"}
      .cc-p8hyfu-stnw88:after{position:absolute}
      .cc-1982bvg-lgv52v:after{right:-2rem}"
    `);
  });

  describe('browserslist options', () => {
    afterEach(() => {
      delete process.env.BROWSERSLIST;
      delete process.env.AUTOPREFIXER_GRID;
    });

    it('should generate prefixes for default', () => {
      const actual = transformCss(
        `
        div {
          user-select: none;
        }
        `
      );
      expect(actual.sheets.join('')).toMatchInlineSnapshot(
        `".cc-m84loq-glywfm div{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}"`
      );
    });

    it('should generate prefixes for ms', () => {
      process.env.BROWSERSLIST = 'Edge 16';
      const actual = transformCss(
        `
        div {
          user-select: none;
        }
        `
      );
      expect(actual.sheets.join('')).toMatchInlineSnapshot(
        `".cc-m84loq-glywfm div{-ms-user-select:none;user-select:none}"`
      );
    });

    it('should not generate any prefixes', () => {
      process.env.BROWSERSLIST = 'Chrome 78';
      const actual = transformCss(
        `
        div {
          user-select: none;
        }
        `
      );
      expect(actual.sheets.join('')).toMatchInlineSnapshot(`
        ".cc-m84loq-glywfm div{
            user-select:none}"
      `);
    });

    it('should generate ms prefixes for grid', () => {
      process.env.AUTOPREFIXER_GRID = 'autoplace';
      const actual = transformCss(
        `
        div {
          display: grid;
        }
        `
      );
      expect(actual.sheets.join('')).toMatchInlineSnapshot(`
        ".cc-f4wkwo-11p5wf0 div{
            display:-ms-grid;
            display:grid}"
      `);
    });
  });
});
