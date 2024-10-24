import { outdent } from 'outdent';
import postcss from 'postcss';

import { sortAtomicStyleSheet } from '../sort-atomic-style-sheet';

const transform = (css: string, enabled = true) => {
  const result = postcss([
    sortAtomicStyleSheet({ sortAtRulesEnabled: true, sortShorthandEnabled: enabled }),
  ]).process(css, {
    from: undefined,
  });

  return result.css;
};

const transformWithoutSorting = (css: string) => transform(css, false);

describe('sort shorthand vs. longhand declarations', () => {
  beforeEach(() => {
    process.env.BROWSERSLIST = 'last 1 version';
  });

  it('sorts against multi-property classes: simple', () => {
    // We need to make sure this `{-webkit-text-decoration-color:initial;text-decoration-color:initial}` doesn't "block" sorting
    const actual = transform(outdent`
      ._zulph461{gap:3px}
      ._bfhk1ayf{background-color:red}
      ._1jmq18uv{-webkit-text-decoration-color:initial;text-decoration-color:initial}
      ._bfhk1ayf{background-color:red}
      ._y44v1tgl{background:red}
      ._kkk21kw7{all:inherit}
    `);

    expect(actual).toMatchInlineSnapshot(`
      "
      ._kkk21kw7{all:inherit}._zulph461{gap:3px}
      ._y44v1tgl{background:red}
      ._bfhk1ayf{background-color:red}
      ._1jmq18uv{-webkit-text-decoration-color:initial;text-decoration-color:initial}
      ._bfhk1ayf{background-color:red}"
    `);
  });

  it('sorts against multi-property classes fully', () => {
    const actual = transform(outdent`
      ._zulph461{gap:var(--ds-space-050)}
      ._y44v1tgl{animation:kbayob8 5s ease infinite}
      ._j6xt1fef:hover{background:var(--_hcgrh3)}
      ._bfhk29zg, ._irr329zg:hover{background-color:var(--ds-background-selected,#deebff)}
      ._bfhk1ayf{background-color:var(--_rgmfhj)}
      ._irr312tn:hover{background-color:var(--_1hwiu8a)}
      ._syaz1qtk{color:var(--ds-link)}
      ._1jmq18uv:hover .linkText{-webkit-text-decoration-color:initial;text-decoration-color:initial}
      ._1owrotz2:active, ._jzfzotz2:focus, ._1mq6otz2:hover{padding:0 var(--ds-space-050,4px)}
      ._apju8stv:hover .linkText{-webkit-text-decoration-line:underline;text-decoration-line:underline}
      @media (min-width:1024px){
        ._j6xt1fef:active{background:var(--_hcgrh3)}
        ._syaz1qtk{color:var(--ds-link)}
        ._1jmq18uv:hover .linkText{-webkit-text-decoration-color:initial;text-decoration-color:initial}
        ._1owrotz2:active, ._jzfzotz2:focus, ._1mq6otz2:hover{padding:0 var(--ds-space-050,4px)}
        ._apju8stv:hover .linkText{-webkit-text-decoration-line:underline;text-decoration-line:underline}
        ._kkk21kw7{all:inherit}
        ._ku3unqa1:hover .linkText{-webkit-text-decoration-style:solid;text-decoration-style:solid}
        ._18s8paju{margin:var(--ds-space-150,9pt) auto 28px auto}
        ._y44v1syn{animation:kbpspdk 5s ease infinite}
      }
      ._ku3unqa1:hover .linkText{-webkit-text-decoration-style:solid;text-decoration-style:solid}
      ._18s8paju{margin:var(--ds-space-150,9pt) auto 28px auto}
      ._y44v1syn{animation:kbpspdk 5s ease infinite}
      @keyframes kbpspdk{0%{stroke-dashoffset:10}}
      ._y44vbxa2{animation:k1qo9wnt 5s ease infinite}
      @media (min-width:30rem){
        ._1letfkly{margin:0 var(--ds-space-400,2pc)}
        ._1wbfxncg{padding:var(--ds-space-800,4pc)}
        ._1tn2iyik{font:var(--ds-font-heading-xlarge,normal 600 29px/2pc ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Ubuntu,system-ui,"Helvetica Neue",sans-serif)}
        ._l7hko0gd [data-ds--text-field--input]{font:var(--ds-font-heading-medium,normal 500 20px/24px ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Ubuntu,system-ui,"Helvetica Neue",sans-serif)}._1odf1h6o{justify-content:center}
        ._j6xt1fef:active{background:var(--_hcgrh3)}
        ._syaz1qtk{color:var(--ds-link)}
        ._1jmq18uv:hover .linkText{-webkit-text-decoration-color:initial;text-decoration-color:initial}
        ._1owrotz2:active, ._jzfzotz2:focus, ._1mq6otz2:hover{padding:0 var(--ds-space-050,4px)}
        ._apju8stv:hover .linkText{-webkit-text-decoration-line:underline;text-decoration-line:underline}
        ._kkk21kw7{all:inherit}
        ._ku3unqa1:hover .linkText{-webkit-text-decoration-style:solid;text-decoration-style:solid}
        ._18s8paju{margin:var(--ds-space-150,9pt) auto 28px auto}
        ._y44v1syn{animation:kbpspdk 5s ease infinite}
        ._pwyo12x7{padding-inline-end:var(--ds-space-075,6px)}
        ._1b7p1epz{padding-left:var(--ds-space-1000,5pc)}
        ._jvmr1epz{padding-right:var(--ds-space-1000,5pc)}
      }
      ._kkk21kw7{all:inherit}
    `);

    expect(actual).toMatchInlineSnapshot(`
      "
      ._kkk21kw7{all:inherit}._zulph461{gap:var(--ds-space-050)}
      ._y44v1tgl{animation:kbayob8 5s ease infinite}
      ._18s8paju{margin:var(--ds-space-150,9pt) auto 28px auto}
      ._y44v1syn{animation:kbpspdk 5s ease infinite}
      ._y44vbxa2{animation:k1qo9wnt 5s ease infinite}
      ._bfhk29zg, ._irr329zg:hover{background-color:var(--ds-background-selected,#deebff)}
      ._bfhk1ayf{background-color:var(--_rgmfhj)}
      ._syaz1qtk{color:var(--ds-link)}
      ._1jmq18uv:hover .linkText{-webkit-text-decoration-color:initial;text-decoration-color:initial}
      ._apju8stv:hover .linkText{-webkit-text-decoration-line:underline;text-decoration-line:underline}
      ._ku3unqa1:hover .linkText{-webkit-text-decoration-style:solid;text-decoration-style:solid}
      ._j6xt1fef:hover{background:var(--_hcgrh3)}
      ._irr312tn:hover{background-color:var(--_1hwiu8a)}
      ._1owrotz2:active, ._jzfzotz2:focus, ._1mq6otz2:hover{padding:0 var(--ds-space-050,4px)}
      @keyframes kbpspdk{0%{stroke-dashoffset:10}}
      @media (min-width:30rem){
        ._kkk21kw7{all:inherit}
        ._1letfkly{margin:0 var(--ds-space-400,2pc)}
        ._1wbfxncg{padding:var(--ds-space-800,4pc)}
        ._1tn2iyik{font:var(--ds-font-heading-xlarge,normal 600 29px/2pc ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Ubuntu,system-ui,"Helvetica Neue",sans-serif)}
        ._l7hko0gd [data-ds--text-field--input]{font:var(--ds-font-heading-medium,normal 500 20px/24px ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Ubuntu,system-ui,"Helvetica Neue",sans-serif)}
        ._18s8paju{margin:var(--ds-space-150,9pt) auto 28px auto}
        ._y44v1syn{animation:kbpspdk 5s ease infinite}._1odf1h6o{justify-content:center}
        ._syaz1qtk{color:var(--ds-link)}
        ._1jmq18uv:hover .linkText{-webkit-text-decoration-color:initial;text-decoration-color:initial}
        ._apju8stv:hover .linkText{-webkit-text-decoration-line:underline;text-decoration-line:underline}
        ._ku3unqa1:hover .linkText{-webkit-text-decoration-style:solid;text-decoration-style:solid}
        ._pwyo12x7{padding-inline-end:var(--ds-space-075,6px)}
        ._1b7p1epz{padding-left:var(--ds-space-1000,5pc)}
        ._jvmr1epz{padding-right:var(--ds-space-1000,5pc)}
        ._j6xt1fef:active{background:var(--_hcgrh3)}
        ._1owrotz2:active, ._jzfzotz2:focus, ._1mq6otz2:hover{padding:0 var(--ds-space-050,4px)}
      }
      @media (min-width:1024px){
        ._kkk21kw7{all:inherit}
        ._18s8paju{margin:var(--ds-space-150,9pt) auto 28px auto}
        ._y44v1syn{animation:kbpspdk 5s ease infinite}
        ._syaz1qtk{color:var(--ds-link)}
        ._1jmq18uv:hover .linkText{-webkit-text-decoration-color:initial;text-decoration-color:initial}
        ._apju8stv:hover .linkText{-webkit-text-decoration-line:underline;text-decoration-line:underline}
        ._ku3unqa1:hover .linkText{-webkit-text-decoration-style:solid;text-decoration-style:solid}
        ._j6xt1fef:active{background:var(--_hcgrh3)}
        ._1owrotz2:active, ._jzfzotz2:focus, ._1mq6otz2:hover{padding:0 var(--ds-space-050,4px)}
      }"
    `);
  });

  it('leaves untouched when no crossover is present', () => {
    const actual = transform(outdent`
      .a {
        outline-width: 1px;
        font: 16px;
      }
      .b {
        font: 24px;
      }
      .c {
        outline-width: 1px;
      }
    `);

    expect(actual).toMatchInlineSnapshot(`
      ".a {
        font: 16px;
        outline-width: 1px;
      }
      .b {
        font: 24px;
      }
      .c {
        outline-width: 1px;
      }"
    `);
  });

  it('sorts when crossover detected', () => {
    const actual = transform(outdent`
      .a {
        outline-width: 1px;
        outline: none;
        font: 16px normal;
        font-weight: bold;
      }
      .b {
        font-weight: bold;
        font: 24px light;
      }
      .c {
        outline: none;
        outline-width: 1px;
      }
    `);

    expect(actual).toMatchInlineSnapshot(`
      ".a {
        outline: none;
        font: 16px normal;
        outline-width: 1px;
        font-weight: bold;
      }
      .b {
        font: 24px light;
        font-weight: bold;
      }
      .c {
        outline: none;
        outline-width: 1px;
      }"
    `);
  });

  it('sorts inside atrules and rules', () => {
    const actual = transform(outdent`
      @media all {
        .a {
          outline-width: 1px;
          outline: none;
          font: 16px normal;
          font-weight: bold;
        }
        .b {
          font-weight: bold;
          font: 24px light;
        }
        .c {
          outline: none;
          outline-width: 1px;
        }
      }

      .a:focus {
        outline-width: 1px;
        outline: none;
        font: 16px normal;
        font-weight: bold;
      }
      .b:not(.a) {
        font-weight: bold;
        font: 24px light;
      }
      .c[aria-label='test'] {
        outline: none;
        outline-width: 1px;
      }

      .a {
        outline-width: 1px;
        outline: none;
        font: 16px normal;
        font-weight: bold;
      }
      .b {
        font-weight: bold;
        font: 24px light;
      }
      .c {
        outline: none;
        outline-width: 1px;
      }
    `);

    expect(actual).toMatchInlineSnapshot(`
      "
      .b:not(.a) {
        font: 24px light;
        font-weight: bold;
      }
      .c[aria-label='test'] {
        outline: none;
        outline-width: 1px;
      }

      .a {
        outline: none;
        font: 16px normal;
        outline-width: 1px;
        font-weight: bold;
      }
      .b {
        font: 24px light;
        font-weight: bold;
      }
      .c {
        outline: none;
        outline-width: 1px;
      }

      .a:focus {
        outline: none;
        font: 16px normal;
        outline-width: 1px;
        font-weight: bold;
      }@media all {
        .a {
          outline: none;
          font: 16px normal;
          outline-width: 1px;
          font-weight: bold;
        }
        .b {
          font: 24px light;
          font-weight: bold;
        }
        .c {
          outline: none;
          outline-width: 1px;
        }
      }"
    `);
  });

  it('sorts border-related properties', () => {
    const actual = transform(outdent`
      .h { border-inline-start: 8px solid purple; }
      .f { border-left: 7px solid red; }
      .g { border-right: 6px dashed green; }
      .e { border-block: 5px dotted yellow; }
      .b { border-width: 4px; }
      .c { border-style: dashed; }
      .d { border-color: pink; }
      .a { border: 3px solid blue; }
    `);

    expect(actual).toMatchInlineSnapshot(`
      "
      .a { border: 3px solid blue; }
      .b { border-width: 4px; }
      .c { border-style: dashed; }
      .d { border-color: pink; }
      .e { border-block: 5px dotted yellow; }
      .f { border-left: 7px solid red; }
      .g { border-right: 6px dashed green; }.h { border-inline-start: 8px solid purple; }"
    `);
  });

  it('sorts a variety of different shorthand properties used together', () => {
    const actual = transform(outdent`

      @media all {
        .f {
          display: block;
        }
        .e {
          border-block-start-color: transparent;
        }
        .c {
          border-block-start: none;
        }
        .d {
          border-top: none;
        }
        .b {
          border: none;
        }
        .a {
          all: unset;
        }
      }

      .f:focus {
        display: block;
      }
      .e:hover {
        border-block-start-color: transparent;
      }
      .d:active {
        border-block-start: none;
      }
      .c[data-foo='bar'] {
        border-top: none;
      }
      .b[disabled] {
        border: none;
      }
      .a > .external {
        all: unset;
      }

      .j {
        margin-bottom: 6px;
      }
      .i {
        margin-inline: 2px;
      }
      .h {
        margin-block: 5px;
      }
      .g {
        margin: 2px;
      }
      .f {
        display: block;
      }
      .e {
        border-block-start-color: transparent;
      }
      .c {
        border-block-start: none;
      }
      .d {
        border-top: none;
      }
      .b {
        border: none;
      }
      .a {
        all: unset;
      }
    `);

    expect(actual).toMatchInlineSnapshot(`
      "
      .a > .external {
        all: unset;
      }
      .a {
        all: unset;
      }
      .b[disabled] {
        border: none;
      }
      .g {
        margin: 2px;
      }
      .b {
        border: none;
      }
      .i {
        margin-inline: 2px;
      }
      .h {
        margin-block: 5px;
      }
      .c[data-foo='bar'] {
        border-top: none;
      }
      .d {
        border-top: none;
      }
      .c {
        border-block-start: none;
      }

      .j {
        margin-bottom: 6px;
      }
      .f {
        display: block;
      }
      .e {
        border-block-start-color: transparent;
      }

      .f:focus {
        display: block;
      }
      .e:hover {
        border-block-start-color: transparent;
      }
      .d:active {
        border-block-start: none;
      }
      @media all {
        .a {
          all: unset;
        }
        .b {
          border: none;
        }
        .d {
          border-top: none;
        }
        .c {
          border-block-start: none;
        }
        .f {
          display: block;
        }
        .e {
          border-block-start-color: transparent;
        }
      }"
    `);
  });

  it('sorts non-atomic classes inline, but only singular declaration rules against each other', () => {
    const actual = transform(outdent`
      .e { border-top: none; }
      .a {
        border-block-start: 1px solid;
        border-top: red;
        all: reset;
        border-block-start-color: transparent;
        border: 2px dashed;
      }
      .f { border-block-start-color: transparent; }
      .d { border: none; }
      .c { all: unset; }
      .b { all: unset; }
    `);

    expect(actual).toMatchInlineSnapshot(`
      "
      .a {
        all: reset;
        border: 2px dashed;
        border-top: red;
        border-block-start: 1px solid;
        border-block-start-color: transparent;
      }
      .c { all: unset; }
      .b { all: unset; }
      .d { border: none; }.e { border-top: none; }
      .f { border-block-start-color: transparent; }"
    `);
  });

  it('sorts a stylesheet that is mainly longhand properties', () => {
    const actual = transform(outdent`
      ._oqicidpf{padding-top:0}
      ._1rmjidpf{padding-right:0}
      ._cjbtidpf{padding-bottom:0}
      ._pnmbidpf{padding-left:0}
      ._glte7vkz{width:1pc}
      ._165t7vkz{height:1pc}
      ._ue5g1408{margin:0 var(--ds-space-800,4pc)}
      ._1yag1dzv{padding:var(--ds-space-100) var(--ds-space-150)}
      ._dbjg12x7{margin-top:var(--ds-space-075,6px)}

      @media (min-width:1200px){
        ._jvpg11p5{display:grid}
        ._szna1wug{margin-top:auto}
        ._13on1wug{margin-right:auto}
        ._1f3k1wug{margin-bottom:auto}
        ._inid1wug{margin-left:auto}
        ._1oqj1epz{padding:var(--ds-space-1000,5pc)}
        ._12wp9ac1{max-width:1400px}
        ._jvpgglyw{display:none}
      }
    `);

    expect(actual).toMatchInlineSnapshot(`
      "
      ._ue5g1408{margin:0 var(--ds-space-800,4pc)}
      ._1yag1dzv{padding:var(--ds-space-100) var(--ds-space-150)}._oqicidpf{padding-top:0}
      ._1rmjidpf{padding-right:0}
      ._cjbtidpf{padding-bottom:0}
      ._pnmbidpf{padding-left:0}
      ._glte7vkz{width:1pc}
      ._165t7vkz{height:1pc}
      ._dbjg12x7{margin-top:var(--ds-space-075,6px)}

      @media (min-width:1200px){
        ._1oqj1epz{padding:var(--ds-space-1000,5pc)}
        ._jvpg11p5{display:grid}
        ._szna1wug{margin-top:auto}
        ._13on1wug{margin-right:auto}
        ._1f3k1wug{margin-bottom:auto}
        ._inid1wug{margin-left:auto}
        ._12wp9ac1{max-width:1400px}
        ._jvpgglyw{display:none}
      }"
    `);
  });

  it('sorts border, border-top, border-top-color', () => {
    const actual = transform(outdent`

      ._abcd1234 { border-top-color: red }
      ._abcd1234 { border-top: 1px solid }
      ._abcd1234 { border: none }
      ._abcd1234:hover { border-top-color: red }
      ._abcd1234:hover { border-top: 1px solid }
      ._abcd1234:hover { border: none }
      ._abcd1234:active { border-top-color: red }
      ._abcd1234:active { border-top: 1px solid }
      ._abcd1234:active { border: none }
      @supports (border: none) {
        ._abcd1234 { border-top-color: red }
        ._abcd1234 { border-top: 1px solid }
        ._abcd1234 { border: none }
      }
      @media (max-width: 50px) { ._abcd1234 { border-top-color: red } }
      @media (max-width: 100px) { ._abcd1234 { border-top: 1px solid } }
      @media (max-width: 120px) {
        ._abcd1234 { border-top-color: red }
        ._abcd1234 { border-top: 1px solid }
        ._abcd1234 { border: none }
      }
      @media (max-width: 150px) { ._abcd1234 { border: none } }
    `);

    expect(actual).toMatchInlineSnapshot(`
      "
      ._abcd1234 { border: none }
      ._abcd1234 { border-top: 1px solid }
      ._abcd1234 { border-top-color: red }
      ._abcd1234:hover { border: none }
      ._abcd1234:hover { border-top: 1px solid }
      ._abcd1234:hover { border-top-color: red }
      ._abcd1234:active { border: none }
      ._abcd1234:active { border-top: 1px solid }
      ._abcd1234:active { border-top-color: red }
      @media (max-width: 150px) { ._abcd1234 { border: none } }
      @media (max-width: 120px) {
        ._abcd1234 { border: none }
        ._abcd1234 { border-top: 1px solid }
        ._abcd1234 { border-top-color: red }
      }
      @media (max-width: 100px) { ._abcd1234 { border-top: 1px solid } }
      @media (max-width: 50px) { ._abcd1234 { border-top-color: red } }
      @supports (border: none) {
        ._abcd1234 { border: none }
        ._abcd1234 { border-top: 1px solid }
        ._abcd1234 { border-top-color: red }
      }"
    `);
  });

  describe('when disabled', () => {
    it('does nothing when crossover detected', () => {
      const actual = transformWithoutSorting(outdent`
        .a {
          outline-width: 1px;
          outline: none;
          font: 16px normal;
          font-weight: bold;
        }
        .b {
          font-weight: bold;
          font: 24px light;
        }
        .c {
          outline: none;
          outline-width: 1px;
        }
      `);

      expect(actual).toMatchInlineSnapshot(`
        ".a {
          outline-width: 1px;
          outline: none;
          font: 16px normal;
          font-weight: bold;
        }
        .b {
          font-weight: bold;
          font: 24px light;
        }
        .c {
          outline: none;
          outline-width: 1px;
        }"
      `);
    });

    it('does not sort inside atrules and rules', () => {
      const actual = transformWithoutSorting(outdent`
        @media all {
          .a {
            outline-width: 1px;
            outline: none;
            font: 16px normal;
            font-weight: bold;
          }
          .b {
            font-weight: bold;
            font: 24px light;
          }
          .c {
            outline: none;
            outline-width: 1px;
          }
        }

        .a:focus {
          outline-width: 1px;
          outline: none;
          font: 16px normal;
          font-weight: bold;
        }
        .b:not(.a) {
          font-weight: bold;
          font: 24px light;
        }
        .c[aria-label='test'] {
          outline: none;
          outline-width: 1px;
        }

        .a {
          outline-width: 1px;
          outline: none;
          font: 16px normal;
          font-weight: bold;
        }
        .b {
          font-weight: bold;
          font: 24px light;
        }
        .c {
          outline: none;
          outline-width: 1px;
        }
      `);

      // NOTE: There's still some default sorting, but not from this.
      expect(actual).toMatchInlineSnapshot(`
        "
        .b:not(.a) {
          font-weight: bold;
          font: 24px light;
        }
        .c[aria-label='test'] {
          outline: none;
          outline-width: 1px;
        }

        .a {
          outline-width: 1px;
          outline: none;
          font: 16px normal;
          font-weight: bold;
        }
        .b {
          font-weight: bold;
          font: 24px light;
        }
        .c {
          outline: none;
          outline-width: 1px;
        }

        .a:focus {
          outline-width: 1px;
          outline: none;
          font: 16px normal;
          font-weight: bold;
        }@media all {
          .a {
            outline-width: 1px;
            outline: none;
            font: 16px normal;
            font-weight: bold;
          }
          .b {
            font-weight: bold;
            font: 24px light;
          }
          .c {
            outline: none;
            outline-width: 1px;
          }
        }"
      `);
    });
  });
});
