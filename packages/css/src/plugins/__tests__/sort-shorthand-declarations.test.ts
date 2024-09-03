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
        outline-width: 1px;
        font: 16px;
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
        outline-width: 1px;
        font: 16px normal;
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
        outline-width: 1px;
        font: 16px normal;
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
        outline-width: 1px;
        font: 16px normal;
        font-weight: bold;
      }@media all {
        .a {
          outline: none;
          outline-width: 1px;
          font: 16px normal;
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

  it("sorts 4 layers deep of shorthands from 'all' to 'border-block-start'", () => {
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
      .a {
        all: unset;
      }
      .a > .external {
        all: unset;
      }
      .b[disabled] {
        border: none;
      }
      .c[data-foo='bar'] {
        border-top: none;
      }

      .f {
        display: block;
      }
      .b {
        border: none;
      }
      .c {
        border-block-start: none;
      }
      .d {
        border-top: none;
      }
      .d:active {
        border-block-start: none;
      }
      .e {
        border-block-start-color: transparent;
      }

      .f:focus {
        display: block;
      }
      .e:hover {
        border-block-start-color: transparent;
      }@media all {
        .a {
          all: unset;
        }
        .f {
          display: block;
        }
        .b {
          border: none;
        }
        .c {
          border-block-start: none;
        }
        .d {
          border-top: none;
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

    // WARNING: This may be wrong as `.a { … }` is not sorted as we expect, it _should_ be 'abcdef' not 'eabcdf'.
    // Is this a real scenario—multiple variables in a singular class?
    expect(actual).toMatchInlineSnapshot(`
      ".e { border-top: none; }
      .a {
        all: reset;
        border: 2px dashed;
        border-block-start: 1px solid;
        border-top: red;
        border-block-start-color: transparent;
      }
      .b { all: unset; }
      .c { all: unset; }
      .d { border: none; }
      .f { border-block-start-color: transparent; }"
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
