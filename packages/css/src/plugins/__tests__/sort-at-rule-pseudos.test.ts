/**
 * @jest-environment node
 */

import { Features, transform as lightningcss } from 'lightningcss';

import { sortAtRulePseudosVisitor } from '../sort-at-rule-pseudos';

const createTransform = (opts: { atomic: boolean }) => (css: string) => {
  const { code } = lightningcss({
    code: Buffer.from(css),
    filename: 'styles.css',
    visitor: sortAtRulePseudosVisitor(),
  });

  return code.toString().trim();
};

describe('#sortAtRulePseudos', () => {
  describe('with atomic classes', () => {
    const transform = createTransform({
      atomic: true,
    });

    it('should sort rules inside AtRules based on lvfha ordering', () => {
      expect(
        transform(`
        @media (max-width: 400px) {
          :active, :link { color: red; }
          :focus { color: pink; }
          :hover { color: green; }
          :focus-visible { color: white; }
          :visited { color: black; }
          :link { color: yellow; }
          :focus-within { color: grey; }
        }
      `)
      ).toMatchInlineSnapshot(
        `"@media (max-width: 400px){._170d1gy6 :link{color:yellow}._19ov11x8 :visited{color:black}._17f1twqo :focus-within{color:grey}._nn1x32ev :focus{color:pink}._y65z1x77 :focus-visible{color:white}._gsnlbf54 :hover{color:green}._xs4x5scu :active, ._170d5scu :link{color:red}}"`
      );
    });

    it('should sort nested rules inside AtRules based on lvfha ordering', () => {
      expect(
        transform(`
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
      `)
      ).toMatchInlineSnapshot(
        `"@media (max-width: 400px){@supports (display: grid){._sqs6bf54 :hover{color:green}._1jnp5scu :active{color:red}}@supports (display: table-cell){@media (max-width: 700px){._1gb81gy6 :link{color:yellow}._1q5y11x8 :focus{color:black}}._165z1gy6 :link{color:yellow}._burk11x8 :visited{color:black}}}"`
      );
    });
  });

  describe.only('without atomic classes', () => {
    const transform = createTransform({ atomic: false });

    it.only('should leave unsorted rules in place', () => {
      expect(
        transform(`
          @media(max-width: 400px) {
            span {
              display: inline-block;
            }
            :active { color: red; }
            input {
              outline: none;
            }
            :focus { color: pink; }
            div {
              display: block;
            }
          }
        `)
      ).toMatchInlineSnapshot(`
        "@media (width <= 400px) {
          :focus {
            color: pink;
          }

          :active {
            color: red;
          }

          span {
            display: inline-block;
          }

          input {
            outline: none;
          }

          div {
            display: block;
          }
        }"
      `);
    });

    it('should sort rules inside AtRules based on lvfha ordering', () => {
      expect(
        transform(`
          @media (max-width: 400px) {
            :active { color: red; }
            :focus { color: pink; }
            :hover { color: green; }
            :focus-visible { color: white; }
            :visited { color: black; }
            :link { color: yellow; }
            :focus-within { color: grey; }
          }
        `)
      ).toMatchInlineSnapshot(`
        "@media (width <= 400px) {
          :link {
            color: #ff0;
          }

          :visited {
            color: #000;
          }

          :focus-within {
            color: gray;
          }

          :focus {
            color: pink;
          }

          :focus-visible {
            color: #fff;
          }

          :hover {
            color: green;
          }

          :active {
            color: red;
          }
        }"
      `);
    });

    it('should sort nested rules inside AtRules based on lvfha ordering', () => {
      expect(
        transform(`
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
        `)
      ).toMatchInlineSnapshot(`
        "@media (width <= 400px) {
          @supports (display: grid) {
            :hover {
              color: green;
            }

            :active {
              color: red;
            }
          }

          @supports (display: table-cell) {
            @media (width <= 700px) {
              :link {
                color: #ff0;
              }

              :focus {
                color: #000;
              }
            }

            :link {
              color: #ff0;
            }

            :visited {
              color: #000;
            }
          }
        }"
      `);
    });
  });
});
