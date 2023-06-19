/**
 * @jest-environment node
 */

import { transform as lightningcss } from 'lightningcss';

import { discardEmptyRules } from '../discard-empty-rules';

const transform = (css: string) => {
  const { code } = lightningcss({
    code: Buffer.from(css),
    filename: 'styles.css',
    visitor: discardEmptyRules(),
  });

  return code.toString().trim();
};

describe('discard empty rules visitor', () => {
  it('should omit rule with undefined value', () => {
    expect(
      transform(`
        span {
          display: undefined;
          color: red;
        }
      `)
    ).toMatchInlineSnapshot(`
      "span {
        color: red;
      }"
    `);
  });

  it('should omit rule with null value', () => {
    expect(
      transform(`
        span {
          display: null;
          color: red;
        }
      `)
    ).toMatchInlineSnapshot(`
      "span {
        color: red;
      }"
    `);
  });

  it('should omit rule with empty value', () => {
    expect(
      transform(`
        span {
          display: ;
          color: red;
        }
      `)
    ).toMatchInlineSnapshot(`
      "span {
        color: red;
      }"
    `);
  });

  it('should omit rule inside selector', () => {
    expect(
      transform(`
        :hover {
          display: undefined;
          color: red;
        }
    `)
    ).toMatchInlineSnapshot(`
      ":hover {
        color: red;
      }"
    `);
  });

  it('should omit selector when no rules with values', () => {
    expect(
      transform(`
        :hover {
          display: undefined;
        }
      `)
    ).toEqual('');
  });
});
