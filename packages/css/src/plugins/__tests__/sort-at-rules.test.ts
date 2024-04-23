import postcss from 'postcss';

import { sortAtomicStyleSheet } from '../sort-atomic-style-sheet';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([sortAtomicStyleSheet()]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('sort at rules', () => {
  beforeEach(() => {
    process.env.BROWSERSLIST = 'last 1 version';
  });

  describe('with atomic classes', () => {
    it('should sort min-width from smallest to biggest', () => {
      const actual = transform`
        @media (min-width: 400px) {
          color: blue;
        }
        @media (min-width: 200px) {
          color: red;
        }
      `;

      expect(actual).toMatchInlineSnapshot(`
        "
                @media (min-width: 200px) {
                  color: red;
                }
                @media (min-width: 400px) {
                  color: blue;
                }
              "
      `);
    });

    it('should sort max-width from biggest to smallest', () => {
      const actual = transform`
        @media (max-width: 200px) {
          color: red;
        }
        @media (max-width: 400px) {
          color: blue;
        }
      `;

      expect(actual).toMatchInlineSnapshot(`
        "
                @media (max-width: 400px) {
                  color: blue;
                }
                @media (max-width: 200px) {
                  color: red;
                }
              "
      `);
    });

    it('should sort min-width from smallest to biggest, then max-width from biggest to smallest', () => {
      const actual = transform`
        @media (min-width: 400px) {
          color: blue;
        }
        @media (max-width: 400px) {
          color: green;
        }
        @media (max-width: 300px) {
          color: yellow;
        }
        @media (min-width: 200px) {
          color: red;
        }
        @media (max-width: 200px) {
          color: purple;
        }
        @media (min-width: 150px) {
          color: indigo;
        }
      `;

      expect(actual).toMatchInlineSnapshot(`
        "
                @media (min-width: 150px) {
                  color: indigo;
                }
                @media (min-width: 200px) {
                  color: red;
                }
                @media (min-width: 400px) {
                  color: blue;
                }
                @media (max-width: 400px) {
                  color: green;
                }
                @media (max-width: 300px) {
                  color: yellow;
                }
                @media (max-width: 200px) {
                  color: purple;
                }
              "
      `);
    });

    it('should sort the range syntax for width, in all forms', () => {
      const actual = transform`
        @media (300px < width <= 400px) {
          color: blue;
        }
        @media (width > 200px) {
          color: red;
        }
        @media (200px < width <= 500px) {
          color: green;
        }
        @media (200px < width) {
          color: yellow;
        }
        @media (width = 200px) {
          color: purple;
        }
        @media (200px = width) {
          color: pink;
        }
        @media (width <= 600px) {
          color: indigo;
        }
      `;

      expect(actual).toMatchInlineSnapshot(`
        "
                @media (width > 200px) {
                  color: red;
                }
                @media (200px < width) {
                  color: yellow;
                }
                @media (200px < width <= 500px) {
                  color: green;
                }
                @media (300px < width <= 400px) {
                  color: blue;
                }
                @media (width <= 600px) {
                  color: indigo;
                }
                @media (width = 200px) {
                  color: purple;
                }
                @media (200px = width) {
                  color: pink;
                }
              "
      `);
    });

    it('should sort the range syntax for width and height, in all forms', () => {
      throw new Error('TODO');
    });

    it('should sort a mixture of range syntax and min/max syntax', () => {
      throw new Error('TODO');
    });

    it('should sort a mix of min-width, min-height, max-width, and max-height', () => {
      throw new Error('TODO');
    });

    it("should sort media queries that don't have dimensional values", () => {
      throw new Error('TODO');
    });

    it("should sort a mix of media queries that don't have dimensional values, and media queries that do", () => {
      throw new Error('TODO');
    });

    it("shouldn't sort media queries with ratios and calc() functions", () => {
      // This is currently not supported
      throw new Error('TODO');
    });

    it("should sort media queries containing several queries linked by 'and' and 'or'", () => {
      throw new Error('TODO');
    });

    it("should sort a mix of media queries with 'and' and 'or', and media queries without", () => {
      throw new Error('TODO');
    });

    it('should sort non-media queries', () => {
      throw new Error('TODO');
    });
  });
});
