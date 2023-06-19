/**
 * @jest-environment node
 */

import { transform as lightningcss } from 'lightningcss';

import { extractStyleSheetsVisitor } from '../extract-stylesheets';

const transform = (css: string) => {
  const stylesheets = jest.fn();

  const result = lightningcss({
    code: Buffer.from(css),
    drafts: {
      nesting: true,
    },
    filename: 'styles.css',
    visitor: extractStyleSheetsVisitor({ callback: stylesheets }),
  });
  console.log('result', result);

  return stylesheets;
};

describe('extract stylesheets visitor', () => {
  it('calls the callback for each root declaration', () => {
    const stylesheets = transform(`
      span {
        color: blue;

        :hover {
          color: purple;
        }
      }

      :focus {
        background-color: lightblue;
      }

      .grid {
        display: flex;
      }

      @media screen {
        @media (min-width:500px) {
          .grid {
            padding: 1rem;
          }
        }
      }
    `);

    expect(stylesheets).toHaveBeenCalledTimes(4);
  });
});
