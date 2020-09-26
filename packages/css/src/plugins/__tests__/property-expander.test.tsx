import postcss from 'postcss';
import { propertyExpander } from '../property-expander';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([propertyExpander]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('property expander', () => {
  it('should expand margin single', () => {
    const result = transform`
      margin: 0;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            margin-top: 0;
            margin-right: 0;
            margin-bottom: 0;
            margin-left: 0;
          "
    `);
  });

  it('should expand margin double', () => {
    const result = transform`
      margin: 0 auto;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            margin-top: 0;
            margin-right: auto;
            margin-bottom: 0;
            margin-left: auto;
          "
    `);
  });

  it('should expand margin triple', () => {
    const result = transform`
      margin: 1px 2px 3px;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            margin-top: 1px;
            margin-right: 2px;
            margin-bottom: 3px;
            margin-left: 2px;
          "
    `);
  });

  it('should expand margin quadruple', () => {
    const result = transform`
      margin: 1px 2px 3px 4px;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            margin-top: 1px;
            margin-right: 2px;
            margin-bottom: 3px;
            margin-left: 4px;
          "
    `);
  });

  it('should expand padding single', () => {
    const result = transform`
      padding: 0;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            padding-top: 0;
            padding-right: 0;
            padding-bottom: 0;
            padding-left: 0;
          "
    `);
  });

  it('should expand padding double', () => {
    const result = transform`
      padding: 0 auto;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            padding-top: 0;
            padding-right: auto;
            padding-bottom: 0;
            padding-left: auto;
          "
    `);
  });

  it('should expand padding triple', () => {
    const result = transform`
      padding: 1px 2px 3px;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            padding-top: 1px;
            padding-right: 2px;
            padding-bottom: 3px;
            padding-left: 2px;
          "
    `);
  });

  it('should expand padding quadruple', () => {
    const result = transform`
      padding: 1px 2px 3px 4px;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            padding-top: 1px;
            padding-right: 2px;
            padding-bottom: 3px;
            padding-left: 4px;
          "
    `);
  });

  it('should expand place content single', () => {
    const result = transform`
      place-content: center;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            align-content: center;
            justify-content: center;
          "
    `);
  });

  it('should expand place content double', () => {
    const result = transform`
      place-content: center start;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            align-content: center;
            justify-content: start;
          "
    `);
  });

  it('should remove node when invalid single', () => {
    const result = transform`
      place-content: left;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
          "
    `);
  });

  it('should expand place items single', () => {
    const result = transform`
      place-items: center;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            align-items: center;
            justify-items: center;
          "
    `);
  });

  it('should expand place items double', () => {
    const result = transform`
      place-items: auto center;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            align-items: auto;
            justify-items: center;
          "
    `);
  });

  it('should expand place self single', () => {
    const result = transform`
      place-self: start;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            align-self: start;
            justify-self: start;
          "
    `);
  });

  it('should expand place self double', () => {
    const result = transform`
      place-self: start end;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            align-self: start;
            justify-self: end;
          "
    `);
  });

  it('should expand overflow single', () => {
    const result = transform`
      overflow: hidden;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            overflow-x: hidden;
            overflow-y: hidden;
          "
    `);
  });

  it('should expand overflow double', () => {
    const result = transform`
      overflow: auto hidden;
    `;

    expect(result).toMatchInlineSnapshot(`
      "
            overflow-x: auto;
            overflow-y: hidden;
          "
    `);
  });

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
});
