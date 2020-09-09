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
      ".cc-bodhpt {
        font-size: 12px;
      }

      .cc-1v3mvmw {
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
      ".cc-60ukzq {
        font-size: 10px;
      }

      .cc-6r23c2:hover {
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
      ".cc-60ukzq {
        font-size: 10px;
      }

      .cc-qp5jj0:hover div {
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
      ".cc-60ukzq {
        font-size: 10px;
      }

      .cc-qp5jj0:hover div {
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
        .cc-1col6tc {
          font-size: 10px;
        }

        .cc-ptu1ql {
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
      ".cc-6r23c2:hover {
        font-size: 12px;
      }

      .cc-6r23c2:hover {
        font-size: 12px;
      }
          "
    `);
  });
});
