import postcss from 'postcss';
import whitespace from 'postcss-normalize-whitespace';
import autoprefixer from 'autoprefixer';
import { atomicifyRules } from '../atomicify-rules';
import { sortAtRulePseudos } from '../sort-at-rule-pseudos';

const transform = (opts = { withAtomicClasses: true }) => (css: TemplateStringsArray) => {
  const plugins = [sortAtRulePseudos(), whitespace, autoprefixer];

  if (opts.withAtomicClasses) {
    plugins.unshift(atomicifyRules());
  }

  const result = postcss(plugins).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('#sortAtRulePseudos', () => {
  beforeEach(() => {
    process.env.BROWSERSLIST = 'last 1 version';
  });

  describe('with atomic classes', () => {
    const transformWithAtomicClasses = transform();

    it('should sort rules inside AtRules based on lvfha ordering', () => {
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

    it('should sort nested rules inside AtRules based on lvfha ordering', () => {
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

  describe('without atomic classes', () => {
    const transformWithoutAtomicClasses = transform({ withAtomicClasses: false });

    it('should leave unsorted rules in place', () => {
      const actual = transformWithoutAtomicClasses`
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

      expect(actual).toMatchInlineSnapshot(
        `"@media (max-width: 400px){display:block;color:red;::disabled{display:block}:link{color:yellow}:visited{color:black}:focus-within{color:grey}:focus{color:pink}:focus-visible{color:white}:hover{color:green}:active{color:red}}"`
      );
    });

    it('should sort rules inside AtRules based on lvfha ordering', () => {
      const actual = transformWithoutAtomicClasses`
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

      expect(actual).toMatchInlineSnapshot(
        `"@media (max-width: 400px){:link{color:yellow}:visited{color:black}:focus-within{color:grey}:focus{color:pink}:focus-visible{color:white}:hover{color:green}:active{color:red}}"`
      );
    });

    it('should sort nested rules inside AtRules based on lvfha ordering', () => {
      const actual = transformWithoutAtomicClasses`
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
        `"@media (max-width: 400px){@supports (display: grid){:hover{color:green}:active{color:red}}@supports (display: table-cell){@media (max-width: 700px){:link{color:yellow}:focus{color:black}}:link{color:yellow}:visited{color:black}}}"`
      );
    });
  });
});
