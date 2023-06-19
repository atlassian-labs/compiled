/**
 * @jest-environment node
 */

import { transform as lightningcss } from 'lightningcss';

import { normalizeCurrentColor } from '../normalize-current-color';

const transform = (css: string) => {
  const { code } = lightningcss({
    code: Buffer.from(css),
    filename: 'styles.css',
    visitor: normalizeCurrentColor(),
  });

  return code.toString().trim();
};

describe('normalize current-color visitor', () => {
  it('transforms current-color to currentColor', () => {
    expect(
      transform(`
        span {
          background: linear-gradient(current-color, blue);
          border: 1px solid current-color;
          color: current-color;
        }
      `)
    ).toMatchInlineSnapshot(`
      "span {
        background: linear-gradient(currentColor, blue);
        border: 1px solid currentColor;
        color: currentColor;
      }"
    `);
  });

  it('transforms currentcolor to currentColor', () => {
    expect(
      transform(`
        span {
          background: linear-gradient(currentcolor, blue);
          border: 1px solid currentcolor;
          color: currentcolor;
        }
      `)
    ).toMatchInlineSnapshot(`
      "span {
        color: currentColor;
        background: linear-gradient(currentColor, #00f);
        border: 1px solid;
      }"
    `);
  });
});
