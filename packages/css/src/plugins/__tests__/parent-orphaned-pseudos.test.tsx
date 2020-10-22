import postcss from 'postcss';
import { parentOrphanedPseudos } from '../parent-orphaned-pseudos';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([parentOrphanedPseudos()]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('parent orphaned pseudos', () => {
  it('should not parent a psuedo that already has a nesting selector', () => {
    const actual = transform`
      div {
        &:hover {
          display: block;
        }
      }
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
            div {
              &:hover {
                display: block;
              }
            }
          "
    `);
  });

  it('should parent an orphened pseudo', () => {
    const actual = transform`
      div {
        :hover {
          display: block;
        }
      }
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
            div {
              &:hover {
                display: block;
              }
            }
          "
    `);
  });

  it('should do nothing if preceding selector is a combinator', () => {
    const actual = transform`
      div {
        div > :hover {
          display: block;
        }
      }
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
            div {
              div > :hover {
                display: block;
              }
            }
          "
    `);
  });

  it('should add nesting selector to top level psuedo', () => {
    const actual = transform`
      :hover {
        display: block;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
            &:hover {
              display: block;
            }
          "
    `);
  });
});
