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
describe('transform()', () => {
  it('removes duplicate at rules', () => {
    expect(
      transform(`
        @media screen {
          span {
            color: blue;
          }
        }

        @media screen {
          span {
            color: blue;
          }

          span:hover {
            color: purple;
          }
        }
      `)
    ).toMatchInlineSnapshot(`
      "@media screen {
        span {
          color: #00f;
        }

        span:hover {
          color: purple;
        }
      }"
    `);
  });

  it('removes duplicate at rules with a different order', () => {
    expect(
      transform(`
        @media screen {
          span {
            color: blue;
          }

          span:hover {
            color: purple;
          }
        }

        @media screen {
          span {
            color: blue;
          }
        }
      `)
    ).toMatchInlineSnapshot(`
      "@media screen {
        span:hover {
          color: purple;
        }

        span {
          color: #00f;
        }
      }"
    `);
  });
});
