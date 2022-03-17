import postcss from 'postcss';

import { sortAtomicStyleSheet } from '../sort-atomic-style-sheet';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([sortAtomicStyleSheet()]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('sort atomic style sheet plugin', () => {
  it('should move at rules to the bottom', () => {
    const actual = transform`
      .media-screen-color-red {
        @media screen {
          color: red;
        }
      }

      .color-blue {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`
      "

            .color-blue {
              color: blue;
            }
            .media-screen-color-red {
              @media screen {
                color: red;
              }
            }
          "
    `);
  });

  it('should sort psuedo rules', () => {
    const actual = transform`
      .hover-color-red:hover  {
        color: red;
      }

      .focus-color-blue:focus {
        color: blue;
      }

      .active-color-white:active {
        color: white;
      }

      .link-color-purple:link {
        color: purple;
      }

      .visited-color-pink:visited {
        color: pink;
      }

      .focus-visible-color-black:focus-visible {
        color: black;
      }

      .focus-within-color-black:focus-within {
        color: black;
      }

      .first-child-color-grey:first-child {
        color: grey;
      }

      .color-blue {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`
      "

            .first-child-color-grey:first-child {
              color: grey;
            }

            .color-blue {
              color: blue;
            }

            .link-color-purple:link {
              color: purple;
            }

            .visited-color-pink:visited {
              color: pink;
            }

            .focus-within-color-black:focus-within {
              color: black;
            }

            .focus-color-blue:focus {
              color: blue;
            }

            .focus-visible-color-black:focus-visible {
              color: black;
            }
            .hover-color-red:hover  {
              color: red;
            }

            .active-color-white:active {
              color: white;
            }
          "
    `);
  });
});
