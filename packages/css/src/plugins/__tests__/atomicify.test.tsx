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
      ".cc-1pnx9r0-1fwxnve {
        font-size: 12px;
      }

      .cc-1e4pr9v-13q2bts {
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
      ".cc-1pnx9r0-19bvopo {
        font-size: 10px;
      }

      .cc-1jb3d95-1fwxnve:hover {
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
      ".cc-1pnx9r0-19bvopo {
        font-size: 10px;
      }

      .cc-dmpyho-1fwxnve:hover div {
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
      ".cc-1pnx9r0-19bvopo {
        font-size: 10px;
      }

      .cc-dmpyho-1fwxnve:hover div {
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
        .cc-f7q224-19bvopo {
          font-size: 10px;
        }

        .cc-1bl9qd5-13q2bts {
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
      ".cc-1jb3d95-1fwxnve:hover {
        font-size: 12px;
      }

      .cc-1jb3d95-1fwxnve:hover {
        font-size: 12px;
      }
          "
    `);
  });
});
