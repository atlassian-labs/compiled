import postcss from 'postcss';
import whitespace from 'postcss-normalize-whitespace';

import { atomicifyRules } from '../atomicify-rules';
import { sortAtomicStyleSheet } from '../sort-atomic-style-sheet';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([
    sortAtomicStyleSheet({ sortAtRulesEnabled: undefined, sortShorthandEnabled: undefined }),
  ]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

const transformWithAtomicClasses = (css: TemplateStringsArray) => {
  const result = postcss([
    atomicifyRules(),
    sortAtomicStyleSheet({ sortAtRulesEnabled: undefined, sortShorthandEnabled: undefined }),
    whitespace(),
  ]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('sorting pseudo-selectors', () => {
  it('should move at-rules to the bottom', () => {
    const actual = transform`
      @media screen {
        .media-screen-color-red {
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
            @media screen {
              .media-screen-color-red {
                color: red;
              }
            }
          "
    `);
  });

  it('should sort pseudo rules', () => {
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

describe('sorting rules inside at-rules (with atomic classes)', () => {
  it('should sort rules inside at-rules based on lvfha ordering', () => {
    const actual = transformWithAtomicClasses`
      @media (max-width: 400px) {
        :active, :link { color: red; }
        :focus { color: pink; }
        :hover { color: green; }
        :focus-visible { color: white; }
        :visited { color: black; }
        :link { color: yellow; }
        :focus-within { color: grey; }
      }
    `;

    expect(actual).toMatchInlineSnapshot(
      `"@media (max-width: 400px){._170d1gy6 :link{color:yellow}._19ov11x8 :visited{color:black}._17f1twqo :focus-within{color:grey}._nn1x32ev :focus{color:pink}._y65z1x77 :focus-visible{color:white}._gsnlbf54 :hover{color:green}._xs4x5scu :active, ._170d5scu :link{color:red}}"`
    );
  });

  it('should sort nested rules inside at-rules based on lvfha ordering', () => {
    const actual = transformWithAtomicClasses`
      @media (max-width: 400px) {
        @supports (display: grid) {
          :active { color: red; }
          :hover { color: green; }
        }

        @supports (display: table-cell) {
          :visited { color: black; }
          :link { color: yellow; }

          @media (max-width: 700px) {
            :focus { color: black; }
            :link { color: yellow; }
          }
        }
      }
    `;

    expect(actual).toMatchInlineSnapshot(
      `"@media (max-width: 400px){@supports (display: grid){._sqs6bf54 :hover{color:green}._1jnp5scu :active{color:red}}@supports (display: table-cell){@media (max-width: 700px){._1gb81gy6 :link{color:yellow}._1q5y11x8 :focus{color:black}}._165z1gy6 :link{color:yellow}._burk11x8 :visited{color:black}}}"`
    );
  });
});

describe('sorting pseudo-selectors inside at-rules (without atomic classes)', () => {
  it('should leave unsorted rules in place', () => {
    const actual = transform`
      @media (max-width: 400px) {
        :active { color: red; }
        :focus { color: pink; }
        ::disabled { display: block; }
        :hover { color: green; }
        :focus-visible { color: white; }
        :visited { color: black; }
        :link { color: yellow; }
        :focus-within { color: grey; }
        display: block;
        color: red;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
            @media (max-width: 400px) {
              display: block;
              color: red;
              ::disabled { display: block; }
              :link { color: yellow; }
              :visited { color: black; }
              :focus-within { color: grey; }
              :focus { color: pink; }
              :focus-visible { color: white; }
              :hover { color: green; }
              :active { color: red; }
            }
          "
    `);
  });

  it('should sort rules inside at-rules based on lvfha ordering', () => {
    const actual = transform`
      @media (max-width: 400px) {
        :active { color: red; }
        :focus { color: pink; }
        :hover { color: green; }
        :focus-visible { color: white; }
        :visited { color: black; }
        :link { color: yellow; }
        :focus-within { color: grey; }
      }
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
            @media (max-width: 400px) {
              :link { color: yellow; }
              :visited { color: black; }
              :focus-within { color: grey; }
              :focus { color: pink; }
              :focus-visible { color: white; }
              :hover { color: green; }
              :active { color: red; }
            }
          "
    `);
  });

  it('should sort nested rules inside at-rules based on lvfha ordering', () => {
    const actual = transform`
      @media (max-width: 400px) {
        @supports (display: grid) {
          :active { color: red; }
          :hover { color: green; }
        }

        @supports (display: table-cell) {
          :visited { color: black; }
          :link { color: yellow; }

          @media (max-width: 700px) {
            :focus { color: black; }
            :link { color: yellow; }
          }
        }
      }
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
            @media (max-width: 400px) {
              @supports (display: grid) {
                :hover { color: green; }
                :active { color: red; }
              }

              @supports (display: table-cell) {

                @media (max-width: 700px) {
                  :link { color: yellow; }
                  :focus { color: black; }
                }
                :link { color: yellow; }
                :visited { color: black; }
              }
            }
          "
    `);
  });
});
