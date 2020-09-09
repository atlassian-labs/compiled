import { transformCss } from '../css-transform';

describe('css transform', () => {
  it('should parent a single pseudo', () => {
    const actual = transformCss(
      '.cls',
      `
      :focus {
        color: hotpink;
      }
    `
    );

    expect(actual.join('\n')).toMatchInlineSnapshot(`".cls:focus{color:hotpink}"`);
  });

  it('should parent multiple pseduos in a group', () => {
    const actual = transformCss(
      '.cls',
      `
      :hover div,
      :focus {
        color: hotpink;
      }
    `
    );

    expect(actual.join('\n')).toMatchInlineSnapshot(`
      ".cls:hover div,
      .cls:focus{color:hotpink}"
    `);
  });

  it('should parent multiple pseudos in a group in a group of multiple', () => {
    const actual = transformCss(
      '.cls',
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

    expect(actual.join('\n')).toMatchInlineSnapshot(`
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

  it('should parent a complex pseudo', () => {
    const actual = transformCss(
      '.cls',
      `
      :nth-child(3) {
        color: hotpink;
      }
    `
    );

    expect(actual.join('\n')).toMatchInlineSnapshot(`".cls:nth-child(3){color:hotpink}"`);
  });

  it('should parent overlapping psuedos', () => {
    const actual = transformCss(
      '.cls',
      `
      & :first-child {
        :first-child {
          color: hotpink;
        }
      }
    `
    );

    expect(actual.join('\n')).toMatchInlineSnapshot(
      `".cls :first-child:first-child{color:hotpink}"`
    );
  });

  it('should parent overlapping pseudos that are reversed', () => {
    const actual = transformCss(
      '.cls',
      `
      & :first-child {
        :first-child & {
          color: hotpink;
        }
      }
    `
    );

    expect(actual.join('\n')).toMatchInlineSnapshot(
      `".cls :first-child:first-child .cls :first-child{color:hotpink}"`
    );
  });

  it('should parent pseudos in nested atrules', () => {
    const actual = transformCss(
      '.cls',
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

    expect(actual.join('\n')).toMatchInlineSnapshot(`
      "@media (max-width: 400px){@supports (display: grid){.cls div,
      .cls:first-child{color:hotpink}}}"
    `);
  });

  it('should ignore pseduos with leading selectors', () => {
    const actual = transformCss(
      '.cls',
      `
      > :first-child {
        color: hotpink;
      }
    `
    );

    expect(actual.join('\n')).toMatchInlineSnapshot(`".cls >:first-child{color:hotpink}"`);
  });

  it('should not affect the output css if theres nothing to do', () => {
    const actual = transformCss(
      '.cls',
      `
      div {
        color: hotpink;
      }
    `
    );

    expect(actual.join('\n')).toMatchInlineSnapshot(`".cls div{color:hotpink}"`);
  });

  it('should ignore parsing a data attribute selector with a comma in it', () => {
    const actual = transformCss(
      '.cls',
      `
      [data-foo=","] {
        color: hotpink;
      }
    `
    );

    expect(actual.join('\n')).toMatchInlineSnapshot(`".cls [data-foo=\\",\\"]{color:hotpink}"`);
  });

  it('should not build charset rules when minifying', () => {
    const actual = transformCss(
      '.cls',
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
      ".cls{position:relative;text-transform:capitalize}
      .cls:after{content:\\"›\\";position:absolute;right:-2rem}"
    `);
  });

  describe('browserslist options', () => {
    afterEach(() => {
      delete process.env.BROWSERSLIST;
      delete process.env.AUTOPREFIXER_GRID;
    });

    it('should generate prefixes for default', () => {
      const actual = transformCss(
        '.cls',
        `
        div {
          user-select: none;
        }
        `
      );
      expect(actual).toContain(
        '.cls div{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}'
      );
    });

    it('should generate prefixes for ms', () => {
      process.env.BROWSERSLIST = 'Edge 16';
      const actual = transformCss(
        '.cls',
        `
        div {
          user-select: none;
        }
        `
      );
      expect(actual).toContain('.cls div{-ms-user-select:none;user-select:none}');
    });

    it('should not generate any prefixes', () => {
      process.env.BROWSERSLIST = 'Chrome 78';
      const actual = transformCss(
        '.cls',
        `
        div {
          user-select: none;
        }
        `
      );
      expect(actual).toContain('.cls div{user-select:none}');
    });

    it('should generate ms prefixes for grid', () => {
      process.env.AUTOPREFIXER_GRID = 'autoplace';
      const actual = transformCss(
        '.cls',
        `
        div {
          display: grid;
        }
        `
      );
      expect(actual).toContain('.cls div{display:-ms-grid;display:grid}');
    });
  });
});
