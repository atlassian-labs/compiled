import postcss from 'postcss';

import { mergeDuplicateAtRules } from '../merge-duplicate-at-rules';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([mergeDuplicateAtRules()]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('discard duplicate at-rule children plugin', () => {
  it('should remove duplicate children', () => {
    const actual = transform`
      @media (min-width:500px){._171dak0l{border:2px solid red}}
      @media (min-width:500px){._171dak0l{border:2px solid red}._1swkri7e:before{content:'large screen'}}
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
            @media (min-width:500px){._171dak0l{border:2px solid red}._1swkri7e:before{content:'large screen'}}
          "
    `);
  });

  it('should remove duplicate children with a different order', () => {
    const actual = transform`
    @media (min-width:500px){._171dak0l{border:2px solid red}._1swkri7e:before{content:'large screen'}}
      @media (min-width:500px){._171dak0l{border:2px solid red}}
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
          @media (min-width:500px){._171dak0l{border:2px solid red}._1swkri7e:before{content:'large screen'}}
          "
    `);
  });

  it('should move merged top-level at-rules after regular rules', () => {
    const actual = transform`
      @media (min-width:500px) { color: red; }
      .default { color: blue; }
      @media (min-width:500px) { background: white; }
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
            .default { color: blue; }
            @media (min-width:500px) { color: red; background: white; }
          "
    `);
  });

  it('should remove duplicate children from nested at-rules', () => {
    const actual = transform`
      @supports not (height: 1lh) {
        @media (min-width:500px) {
          color: red;
          color: green;
        }
      }

      @supports not (height: 1lh) {
        @media (min-width:500px) {
          color: red;
          color: blue;
        }
      }
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
            @supports not (height: 1lh) {
              @media (min-width:500px) {
                color: red;
                color: green;
                color: blue;
              }
            }
          "
    `);
  });

  it('should keep nested at-rules scoped to their parent conditions', () => {
    const actual = transform`
      @supports (display: grid) {
        @media (min-width:500px) {
          color: red;
        }
      }

      @supports (display: flex) {
        @media (min-width:500px) {
          color: blue;
        }
      }
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
            @supports (display: grid) {
              @media (min-width:500px) {
                color: red;
              }
            }
            @supports (display: flex) {
              @media (min-width:500px) {
                color: blue;
              }
            }
          "
    `);
  });

  it('should preserve nested non-atomic at-rules', () => {
    const actual = transform`
      @supports (display: grid) {
        @media (min-width:500px) {
          .cc-first { color: red; }
        }
      }

      @supports (display: grid) {
        @media (min-width:500px) {
          .cc-second { color: blue; }
        }
      }
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
            @supports (display: grid) {
              @media (min-width:500px) {
                .cc-first { color: red; }
              }
            }

            @supports (display: grid) {
              @media (min-width:500px) {
                .cc-second { color: blue; }
              }
            }
          "
    `);
  });
});
