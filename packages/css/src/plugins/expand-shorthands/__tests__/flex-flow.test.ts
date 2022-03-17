import postcss from 'postcss';

import { expandShorthands } from '../../expand-shorthands';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([expandShorthands()]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('flex flow property expander', () => {
  it('should expand flex-flow direction single', () => {
    const result = transform`
      flex-flow: column;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            flex-direction: column;
            flex-wrap: nowrap;
          "
    `);
  });

  it('should expand flex-flow wrap single', () => {
    const result = transform`
      flex-flow: wrap;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            flex-direction: row;
            flex-wrap: wrap;
          "
    `);
  });

  it('should expand flex-flow direction double', () => {
    const result = transform`
      flex-flow: row wrap;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            flex-direction: row;
            flex-wrap: wrap;
          "
    `);
  });

  it('should expand flex-flow wrap double', () => {
    const result = transform`
      flex-flow: wrap row;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            flex-direction: row;
            flex-wrap: wrap;
          "
    `);
  });

  it('should remove flex-flow invalid single', () => {
    const result = transform`
      flex-flow: asd;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
          "
    `);
  });

  it('should remove flex-flow invalid double', () => {
    const result = transform`
      flex-flow: flow asd;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
          "
    `);
  });

  it('should remove flex-flow invalid double', () => {
    const result = transform`
      flex-flow: flow flow;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
          "
    `);
  });

  it('should remove flex-flow invalid double', () => {
    const result = transform`
      flex-flow: wrap wrap;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
          "
    `);
  });
});
