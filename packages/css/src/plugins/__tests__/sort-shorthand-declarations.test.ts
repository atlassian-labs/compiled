import { outdent } from 'outdent';
import postcss from 'postcss';

import { sortAtomicStyleSheet } from '../sort-atomic-style-sheet';

const transform = (css: string, enabled = true) => {
  const result = postcss([
    sortAtomicStyleSheet({ sortAtRulesEnabled: false, sortShorthandEnabled: enabled }),
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
