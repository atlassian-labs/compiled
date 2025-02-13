import postcss from 'postcss';

import { sortAtomicStyleSheet } from '../sort-atomic-style-sheet';

const transform = (css: string) => {
  const result = postcss([
    sortAtomicStyleSheet({ sortAtRulesEnabled: undefined, sortShorthandEnabled: undefined }),
  ]).process(css, {
    from: undefined,
  });

  return result.css;
};

describe('sort at-rules', () => {
  beforeEach(() => {
    process.env.BROWSERSLIST = 'last 1 version';
  });

  describe('with atomic classes', () => {
    it('should sort min-width from smallest to biggest', () => {
      const actual = transform(`
        @media (min-width: 400px) {
          color: blue;
        }
        @media (min-width: 200px) {
          color: red;
        }
      `);

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
      const actual = transform(`
        @media (max-width: 200px) {
          color: blue;
        }
        @media (max-width: 400px) {
          color: red;
        }
      `);

      expect(actual).toMatchInlineSnapshot(`
        "
                @media (max-width: 400px) {
                  color: red;
                }
                @media (max-width: 200px) {
                  color: blue;
                }
              "
      `);
    });

    it('should sort min-width from smallest to biggest, then max-width from biggest to smallest', () => {
      const actual = transform(`
        @media (min-width: 400px) {
          color: yellow;
        }
        @media (max-width: 400px) {
          color: green;
        }
        @media (max-width: 300px) {
          color: blue;
        }
        @media (min-width: 200px) {
          color: orange;
        }
        @media (max-width: 200px) {
          color: purple;
        }
        @media (min-width: 150px) {
          color: red;
        }
      `);

      expect(actual).toMatchInlineSnapshot(`
        "
                @media (min-width: 150px) {
                  color: red;
                }
                @media (min-width: 200px) {
                  color: orange;
                }
                @media (min-width: 400px) {
                  color: yellow;
                }
                @media (max-width: 400px) {
                  color: green;
                }
                @media (max-width: 300px) {
                  color: blue;
                }
                @media (max-width: 200px) {
                  color: purple;
                }
              "
      `);
    });

    it('should sort the range syntax for width, in all forms', () => {
      const actual = transform(`
        @media (300px < width <= 400px) {
          color: green;
        }
        @media (width > 200px) {
          color: orange;
        }
        @media (200px < width <= 500px) {
          color: yellow;
        }
        @media (200px < width) {
          color: red;
        }
        @media (width = 200px) {
          color: pink;
        }
        @media (200px = width) {
          color: purple;
        }
        @media (width <= 600px) {
          color: blue;
        }
      `);

      expect(actual).toMatchInlineSnapshot(`
        "
                @media (200px < width) {
                  color: red;
                }
                @media (width > 200px) {
                  color: orange;
                }
                @media (200px < width <= 500px) {
                  color: yellow;
                }
                @media (300px < width <= 400px) {
                  color: green;
                }
                @media (width <= 600px) {
                  color: blue;
                }
                @media (200px = width) {
                  color: purple;
                }
                @media (width = 200px) {
                  color: pink;
                }
              "
      `);
    });

    it('should sort the range syntax for width and height, in all forms', () => {
      const actual = transform(`
        @media (300px < height <= 400px) {
          color: blue;
        }
        @media (300px < width <= 400px) {
          color: yellow;
        }

        @media (height > 200px) {
          color: lime;
        }
        @media (width > 200px) {
          color: red;
        }

        @media (200px < height <= 500px) {
          color: aqua;
        }
        @media (200px < width <= 500px) {
          color: orange;
        }

        @media (200px < height) {
          color: green;
        }
        @media (200px < width) {
          color: maroon;
        }

        @media (height = 200px) {
          color: white;
        }
        @media (width = 200px) {
          color: fuchsia;
        }

        @media (200px = height) {
          color: black;
        }
        @media (200px = width) {
          color: purple;
        }

        @media (height <= 600px) {
          color: navy;
        }
        @media (width <= 600px) {
          color: indigo;
        }
      `);

      expect(actual).toMatchInlineSnapshot(`
        "
                @media (200px < width) {
                  color: maroon;
                }
                @media (width > 200px) {
                  color: red;
                }
                @media (200px < width <= 500px) {
                  color: orange;
                }
                @media (300px < width <= 400px) {
                  color: yellow;
                }

                @media (200px < height) {
                  color: green;
                }

                @media (height > 200px) {
                  color: lime;
                }

                @media (200px < height <= 500px) {
                  color: aqua;
                }
                @media (300px < height <= 400px) {
                  color: blue;
                }
                @media (width <= 600px) {
                  color: indigo;
                }

                @media (height <= 600px) {
                  color: navy;
                }
                @media (200px = width) {
                  color: purple;
                }
                @media (width = 200px) {
                  color: fuchsia;
                }

                @media (200px = height) {
                  color: black;
                }

                @media (height = 200px) {
                  color: white;
                }
              "
      `);
    });

    it('should sort a mixture of range syntax and min/max syntax', () => {
      const actual = transform(`
        @media (300px <= height <= 400px) {
          color: green;
        }
        @media (300px < height <= 400px) {
          color: red;
        }
        @media (min-height: 300px) {
          color: yellow;
        }
        @media (max-height: 300px) {
          color: purple;
        }
        @media (min-height: 400px) {
          color: blue;
        }
        @media (300px <= height) {
          color: orange;
        }
      `);
      expect(actual).toMatchInlineSnapshot(`
        "
                @media (300px < height <= 400px) {
                  color: red;
                }
                @media (300px <= height) {
                  color: orange;
                }
                @media (min-height: 300px) {
                  color: yellow;
                }
                @media (300px <= height <= 400px) {
                  color: green;
                }
                @media (min-height: 400px) {
                  color: blue;
                }
                @media (max-height: 300px) {
                  color: purple;
                }
              "
      `);
    });

    it('should sort a mixture of range syntax and min/max syntax that are equivalent in a deterministic way', () => {
      // Here, we fall back to the `localeCompare` sorting function (i.e.
      // lexicographical sorting).
      const actual = transform(`
        @media (300px >= height) {
          color: red;
        }
        @media (max-height: 300px) {
          color: blue;
        }
        @media (height <= 300px) {
          color: green;
        }
      `);
      expect(actual).toMatchInlineSnapshot(`
        "
                @media (300px >= height) {
                  color: red;
                }
                @media (height <= 300px) {
                  color: green;
                }
                @media (max-height: 300px) {
                  color: blue;
                }
              "
      `);
    });

    it('should sort a mix of min-width, min-height, max-width, and max-height', () => {
      const actual = transform(`
        @media (max-height: 200px) {
          color: blue;
        }
        @media (max-width: 200px) {
          color: green;
        }
        @media (min-height: 200px) {
          color: yellow;
        }
        @media (min-width: 200px) {
          color: red;
        }
      `);

      expect(actual).toMatchInlineSnapshot(`
        "
                @media (min-width: 200px) {
                  color: red;
                }
                @media (min-height: 200px) {
                  color: yellow;
                }
                @media (max-width: 200px) {
                  color: green;
                }
                @media (max-height: 200px) {
                  color: blue;
                }
              "
      `);
    });

    it("should sort media queries that don't have dimensional values", () => {
      const actual = transform(`
        @media screen {
          color: blue;
        }
        @media print {
          color: green;
        }
        @media all {
          color: red;
        }
      `);
      expect(actual).toMatchInlineSnapshot(`
        "
                @media all {
                  color: red;
                }
                @media print {
                  color: green;
                }
                @media screen {
                  color: blue;
                }
              "
      `);
    });

    it('should sort media queries that have unsupported dimensional values', () => {
      const actual = transform(`
        @media (update: none) {
          color: black;
        }
        @media screen {
          color: blue;
        }
        @media (scan: interlace) {
          font-family: sans-serif;
        }
        @media print {
          color: green;
        }
        @media (monochrome) {
          color: gray;
        }
        @media (color-index >= 1) {
          color: purple;
        }
        @media all {
          color: red;
        }
      `);
      expect(actual).toMatchInlineSnapshot(`
        "
                @media (color-index >= 1) {
                  color: purple;
                }
                @media (monochrome) {
                  color: gray;
                }
                @media (scan: interlace) {
                  font-family: sans-serif;
                }
                @media (update: none) {
                  color: black;
                }
                @media all {
                  color: red;
                }
                @media print {
                  color: green;
                }
                @media screen {
                  color: blue;
                }
              "
      `);
    });

    it('should sort a mix of device-width, min/max-device-width, device-height, and min/max-device-height', () => {
      const actual = transform(`
        @media (device-height < 200px) {
          color: pink;
        }
        @media (max-width: 200px) {
          color: pink;
        }
        @media (device-width < 200px) {
          color: pink;
        }
        @media (device-width > 200px) {
          color: pink;
        }
        @media (max-height: 200px) {
          color: pink;
        }
        @media (device-width = 200px) {
          color: pink;
        }
      `);

      expect(actual).toMatchInlineSnapshot(`
        "
                @media (max-width: 200px) {
                  color: pink;
                }
                @media (max-height: 200px) {
                  color: pink;
                }
                @media (device-width > 200px) {
                  color: pink;
                }
                @media (device-width < 200px) {
                  color: pink;
                }
                @media (device-height < 200px) {
                  color: pink;
                }
                @media (device-width = 200px) {
                  color: pink;
                }
              "
      `);
    });

    it("shouldn't try to sort invalid uses of min/max-device-width, min/max-device-height, min/max-width, min/max-height", () => {
      for (const invalidFeature of [
        'min-device-width',
        'max-device-width',
        'min-device-height',
        'max-device-height',
        'min-width',
        'max-width',
        'min-height',
        'max-height',
      ]) {
        expect(() =>
          transform(`
              @media (${invalidFeature} < 200px) {
                color: pink;
              }
            `)
        ).toThrowError(SyntaxError);
      }

      for (const invalidFeature of ['device-width', 'device-height', 'width', 'height']) {
        expect(() =>
          transform(`
            @media (${invalidFeature}: 200px) {
              color: pink;
            }
          `)
        ).toThrowError(SyntaxError);
      }
    });

    it("should sort a mix of media queries that don't have dimensional values, and media queries that do", () => {
      const actual = transform(`
        @media screen {
          color: blue;
        }
        @media (scan: interlace) {
          font-family: sans-serif;
        }
        @media (height <= 200px) {
          color: pink;
        }
        @media (min-width: 50px) {
          color: beige;
        }
        @media print {
          color: green;
        }
        @media (monochrome) {
          color: gray;
        }
        @media (color-index >= 1) {
          color: purple;
        }
      `);

      expect(actual).toMatchInlineSnapshot(`
        "
                @media (color-index >= 1) {
                  color: purple;
                }
                @media (monochrome) {
                  color: gray;
                }
                @media (scan: interlace) {
                  font-family: sans-serif;
                }
                @media print {
                  color: green;
                }
                @media screen {
                  color: blue;
                }
                @media (min-width: 50px) {
                  color: beige;
                }
                @media (height <= 200px) {
                  color: pink;
                }
              "
      `);
    });

    it("shouldn't sort media queries with ratios or calc() functions", () => {
      // This is currently not supported - media queries with ratios and calc() functions
      // will be sorted purely alphabetically, without regard for their media features
      // (e.g. max-width) and values.
      //
      // They will also all appear before media queries with parse-able values.

      const actual = transform(`
        @media (width < calc(100px + 20px)) {
          color: green;
        }
        @media (calc(100px + 20px) > width) {
          color: green;
        }
        @media (50px > width) {
          color: red;
        }
        @media (max-width: 50px) {
          color: purple;
        }
        @media (min-width: calc(50px + 20px)) {
          color: blue;
        }
        @media (max-width: calc(50px + 20px)) {
          color: blue;
        }
      `);

      expect(actual).toMatchInlineSnapshot(`
        "
                @media (calc(100px + 20px) > width) {
                  color: green;
                }
                @media (max-width: calc(50px + 20px)) {
                  color: blue;
                }
                @media (min-width: calc(50px + 20px)) {
                  color: blue;
                }
                @media (width < calc(100px + 20px)) {
                  color: green;
                }
                @media (50px > width) {
                  color: red;
                }
                @media (max-width: 50px) {
                  color: purple;
                }
              "
      `);
    });

    it("should sort media queries containing several queries linked by 'and' and 'or'", () => {
      const actual = transform(`
        @media (width > 1500px) and (height < 500px) {
          color: purple;
        }
        @media (width > 1500px) and (width < 200px) {
          color: blue;
        }
        @media (width > 1000px) and (width < 200px) {
          color: yellow;
        }
        @media (width > 1000px) and (height < 500px) {
          color: green;
        }
        @media (width > 1000px) and (width < 500px) {
          color: red;
        }
      `);
      expect(actual).toMatchInlineSnapshot(`
        "
                @media (width > 1000px) and (width < 500px) {
                  color: red;
                }
                @media (width > 1000px) and (width < 200px) {
                  color: yellow;
                }
                @media (width > 1000px) and (height < 500px) {
                  color: green;
                }
                @media (width > 1500px) and (width < 200px) {
                  color: blue;
                }
                @media (width > 1500px) and (height < 500px) {
                  color: purple;
                }
              "
      `);
    });

    it("should sort a mix of media queries with 'and' and 'or', and media queries without", () => {
      const actual = transform(`
        @media screen and (width < 500px) {
          color: abc;
        }
        @media (width < 500px) {
          color: abc;
        }
        @media screen and (width < 500px) and (width > 1000px) {
          color: abc;
        }
        @media screen and (width > 1000px) {
          color: abc;
        }
        @media screen and not (width < 500px) {
          color: abc;
        }
        @media screen and (width < 500px) and (width > 1000px) or (height > 1000px) {
          color: abc;
        }
      `);

      expect(actual).toMatchInlineSnapshot(`
        "
                @media screen and (width > 1000px) {
                  color: abc;
                }
                @media (width < 500px) {
                  color: abc;
                }
                @media screen and (width < 500px) {
                  color: abc;
                }
                @media screen and not (width < 500px) {
                  color: abc;
                }
                @media screen and (width < 500px) and (width > 1000px) {
                  color: abc;
                }
                @media screen and (width < 500px) and (width > 1000px) or (height > 1000px) {
                  color: abc;
                }
              "
      `);
    });

    it('should sort @container queries just like media queries', () => {
      const actual = transform(`
        @media (min-width: 400px) {
          color: purple;
        }
        @media (min-width: 200px) {
          color: blue;
        }
        @container summary (height > 200px) and (width > 400px) {
          color: yellow;
        }
        @container tall (height > 300px) {
          color: green;
        }
        @container sidebar (height > 200px) {
          color: orange;
        }
        @container (width > 400px) {
          color: red;
        }
      `);

      expect(actual).toMatchInlineSnapshot(`
        "
                @container (width > 400px) {
                  color: red;
                }
                @container sidebar (height > 200px) {
                  color: orange;
                }
                @container summary (height > 200px) and (width > 400px) {
                  color: yellow;
                }
                @container tall (height > 300px) {
                  color: green;
                }
                @media (min-width: 200px) {
                  color: blue;
                }
                @media (min-width: 400px) {
                  color: purple;
                }
              "
      `);
    });

    it('should sort non-media queries too', () => {
      // We make no assumption here on whether other parts of Compiled actually support
      // all of these... but we might as well sort them consistently.
      const actual = transform(`
        @supports (display: flex) {
          color: blue;
        }
        @media (300px <= height <= 400px) {
          color: yellow;
        }
        @property --item-size {
          syntax: "<percentage>";
          inherits: true;
          initial-value: 20%;
        }
        @layer module, state;
        @media (300px < height <= 400px) {
          color: indigo;
        }
        @layer state {
          p {
            color: orange;
          }
        }
        @media (min-height: 400px) {
          color: purple;
        }
        @supports (color: red) {
          color: red;
        }
        @media (300px <= height) {
          color: green;
        }
        @layer module {
          p {
            color: pink;
          }
        }
      `);

      expect(actual).toMatchInlineSnapshot(`
        "
                @layer module {
                  p {
                    color: pink;
                  }
                }
                @layer module, state;
                @layer state {
                  p {
                    color: orange;
                  }
                }
                @media (300px < height <= 400px) {
                  color: indigo;
                }
                @media (300px <= height) {
                  color: green;
                }
                @media (300px <= height <= 400px) {
                  color: yellow;
                }
                @media (min-height: 400px) {
                  color: purple;
                }
                @property --item-size {
                  syntax: "<percentage>";
                  inherits: true;
                  initial-value: 20%;
                }
                @supports (color: red) {
                  color: red;
                }
                @supports (display: flex) {
                  color: blue;
                }
              "
      `);
    });

    it('should normalise lengths of different units', () => {
      // We assume that 1ch = 1ex = 0.5rem = 0.5em = 8px
      const actual = transform(`
        @media (width > 200px) {
          color: abc;
        }
        @media (width > 26.1ch) {
          color: abc;
        }
        @media (width > 26.0ex) {
          color: abc;
        }
        @media (width > 12.51rem) {
          color: abc;
        }
        @media (width > 12.5000001em) {
          color: abc;
        }
      `);

      expect(actual).toMatchInlineSnapshot(`
        "
                @media (width > 200px) {
                  color: abc;
                }
                @media (width > 12.5000001em) {
                  color: abc;
                }
                @media (width > 12.51rem) {
                  color: abc;
                }
                @media (width > 26.0ex) {
                  color: abc;
                }
                @media (width > 26.1ch) {
                  color: abc;
                }
              "
      `);
    });

    it("shouldn't crash when height property is in a non-media query", () => {
      const actual = transform(`
        @supports not (height: 1lh) {
          height: 1lh;
        }
        @media (width > 200px) {
          color: abc;
        }
        @media (width > 26.1ch) {
          color: abc;
        }
      `);

      expect(actual).toMatchInlineSnapshot(`
        "
                @media (width > 200px) {
                  color: abc;
                }
                @media (width > 26.1ch) {
                  color: abc;
                }
                @supports not (height: 1lh) {
                  height: 1lh;
                }
              "
      `);
    });
  });
});
