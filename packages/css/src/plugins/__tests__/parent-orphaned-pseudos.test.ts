/**
 * @jest-environment node
 */

import { transform as lightningcss } from 'lightningcss';

const transform = (css: string) => {
  const { code } = lightningcss({
    code: Buffer.from(css),
    drafts: {
      nesting: true,
    },
    filename: 'styles.css',
  });

  return code.toString().trim();
};

describe('nested selectors', () => {
  it('should not parent a psuedo that already has a nesting selector', () => {
    expect(
      transform(`
        div {
          &:hover {
            display: block;
          }
        }
      `)
    ).toMatchInlineSnapshot(`
      "div {
        &:hover {
          display: block;
        }
      }"
    `);
  });

  it('should parent an orphaned pseudo', () => {
    expect(
      transform(`
        div {
          :hover {
            display: block;
          }
        }
      `)
    ).toMatchInlineSnapshot(`
      "div {
        &:hover {
          display: block;
        }
      }"
    `);
  });

  it('should do nothing if preceding selector is a combinator', () => {
    expect(
      transform(`
        div {
          & div > :hover {
            display: block;
          }
        }
      `)
    ).toMatchInlineSnapshot(`
      "div {
        div > :hover {
          display: block;
        }
      }"
    `);
  });

  it('should add nesting selector to top level psuedo', () => {
    expect(
      transform(`
        :hover {
          display: block;
        }
      `)
    ).toMatchInlineSnapshot(`
      "&:hover {
        display: block;
      }"
    `);
  });

  it('should add nesting selector to dangling pseudo that has a appended nesting selector', () => {
    expect(
      transform(`
        :first-child & {
          color: hotpink;
        }
      `)
    ).toMatchInlineSnapshot(`
      "&:first-child & {
        color: #ff69b4;
      }"
    `);
  });

  it('should do nothing when a nesting selector is appended to selector', () => {
    expect(
      transform(`
        [data-look='h100']& {
          display: block;
        }
      `)
    ).toMatchInlineSnapshot(`
      "[data-look="h100"]& {
        display: block;
      }"
    `);
  });

  it('should prepend nesting selector to multiple selector groups', () => {
    expect(
      transform(`
        :hover, :active {
          display: block;
        }
      `)
    ).toMatchInlineSnapshot(`
      "&:hover, &:active {
        display: block;
      }"
    `);
  });

  it('should prepend nesting selector to multiple selector groups', () => {
    expect(
      transform(`
        div, :active {
          display: block;
        }
      `)
    ).toMatchInlineSnapshot(`
      "div, &:active {
        display: block;
      }"
    `);
  });
});
