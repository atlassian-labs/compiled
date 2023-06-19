/**
 * @jest-environment node
 */

import { transform as lightningcss } from 'lightningcss';

const transform = (css: string) => {
  const { code } = lightningcss({
    code: Buffer.from(css),
    filename: 'styles.css',
  });

  return code.toString().trim();
};

describe('discard duplicates', () => {
  it('does nothing if no duplicates', () => {
    expect(
      transform(`
        span {
          display: block;
          margin: 0 auto;
        }
      `)
    ).toMatchInlineSnapshot(`
      "span {
        margin: 0 auto;
        display: block;
      }"
    `);
  });

  it('discards duplicates', () => {
    expect(
      transform(`
        span {
          display: block;
          display: flex;
        }
      `)
    ).toMatchInlineSnapshot(`
      "span {
        display: flex;
      }"
    `);
  });
});
