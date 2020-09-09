import postcss from 'postcss';
import nested from 'postcss-nested';
import pretty from 'cssbeautify';
import { parentOrphanedPseudos } from '../parent-orphaned-pseudos';
import { atomicify } from '../atomicify';

const transform = (css: string) => {
  const result = postcss([parentOrphanedPseudos(), nested(), atomicify()]).process(css, {
    from: undefined,
  });

  return pretty(result.css, { indent: '  ', autosemicolon: true });
};

describe('atomicify plugin', () => {
  it('should transform a rule to an atomic declaration', () => {
    const result = transform(`
      font-size: 12px;
      color: blue;
    `);

    expect(result).toMatchInlineSnapshot(`
      ".cc--font-size-12px {
        font-size: 12px;
      }

      .cc--color-blue {
        color: blue;
      }
          "
    `);
  });

  it('should transform a pseudo selector rule to an atomic declaration', () => {
    const result = transform(`
      font-size: 10px;
      :hover {
        font-size: 12px;
      }
    `);

    expect(result).toMatchInlineSnapshot(`
      ".cc--font-size-10px {
        font-size: 10px;
      }

      .cc-:hover-font-size-12px:hover {
        font-size: 12px;
      }
          "
    `);
  });

  it('should transform a pseudo selector nested rule to an atomic declaration', () => {
    const result = transform(`
      font-size: 10px;
      :hover div {
        font-size: 12px;
      }
    `);

    expect(result).toMatchInlineSnapshot(`
      ".cc--font-size-10px {
        font-size: 10px;
      }

      .cc-:hover___div-font-size-12px:hover div {
        font-size: 12px;
      }
          "
    `);
  });

  it('should transform a pseudo selector nested rule to an atomic declaration', () => {
    const result = transform(`
      font-size: 10px;
      :hover {
        div {
          font-size: 12px;
        }
      }
    `);

    expect(result).toMatchInlineSnapshot(`
      ".cc--font-size-10px {
        font-size: 10px;
      }

      .cc-:hover___div-font-size-12px:hover div {
        font-size: 12px;
      }
          "
    `);
  });

  it('should transform media rule to an atomic declaration', () => {
    const result = transform(`
      @media screen and (min-width: 800px) {
        font-size: 10px;
        color: blue;
      }
    `);

    expect(result).toMatchInlineSnapshot(`
      "@media screen and (min-width: 800px) {
        .cc-mediascreenand(min-width:800px)-font-size-10px {
          font-size: 10px;
        }

        .cc-mediascreenand(min-width:800px)-color-blue {
          color: blue;
        }
      }
          "
    `);
  });

  it('should merge semantically duplicate declarations', () => {
    const result = transform(`
      :hover {
        font-size: 12px;
      }

      &:hover {
        font-size: 12px;
      }
    `);

    expect(result).toMatchInlineSnapshot(`
      ".cc-:hover-font-size-12px:hover {
        font-size: 12px;
      }

      .cc-:hover-font-size-12px:hover {
        font-size: 12px;
      }
          "
    `);
  });
});
