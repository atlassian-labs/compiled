import postcss from 'postcss';

import { expandShorthands } from '../../expand-shorthands';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([expandShorthands()]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('outline property expander', () => {
  it('should expand outline single color', () => {
    const result = transform`
      outline: red;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            outline-color: red;
            outline-style: none;
            outline-width: medium;
          "
    `);
  });

  it('should expand outline single style', () => {
    const result = transform`
      outline: solid;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            outline-color: currentColor;
            outline-style: solid;
            outline-width: medium;
          "
    `);
  });

  it('should expand outline single width', () => {
    const result = transform`
      outline: 10px;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            outline-color: currentColor;
            outline-style: none;
            outline-width: 10px;
          "
    `);
  });

  it('should expand outline single width named', () => {
    const result = transform`
      outline: thin;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            outline-color: currentColor;
            outline-style: none;
            outline-width: thin;
          "
    `);
  });

  it('should expand outline double', () => {
    const result = transform`
      outline: red solid;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            outline-color: red;
            outline-style: solid;
            outline-width: medium;
          "
    `);
  });

  it('should expand outline double reversed', () => {
    const result = transform`
      outline: solid red;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            outline-color: red;
            outline-style: solid;
            outline-width: medium;
          "
    `);
  });

  it('should expand outline triple', () => {
    const result = transform`
      outline: red solid 2px;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            outline-color: red;
            outline-style: solid;
            outline-width: 2px;
          "
    `);
  });

  it('should expand outline triple reversed', () => {
    const result = transform`
      outline: solid 2px red;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            outline-color: red;
            outline-style: solid;
            outline-width: 2px;
          "
    `);
  });

  it('should remove outline single invalid', () => {
    const result = transform`
      outline: asd;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
          "
    `);
  });

  it('should remove outline double invalid', () => {
    const result = transform`
      outline: asd solid;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
          "
    `);
  });

  it('should remove outline triple invalid', () => {
    const result = transform`
      outline: 10px solid asd;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
          "
    `);
  });

  it('should remove outline double invalid', () => {
    const result = transform`
      outline: 10px 10px;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
          "
    `);
  });

  it('should remove outline triple invalid', () => {
    const result = transform`
      outline: 10px solid 10px;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
          "
    `);
  });
});
