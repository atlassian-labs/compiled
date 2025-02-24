import postcss from 'postcss';

import { expandShorthands } from '../../expand-shorthands';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([expandShorthands()]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('flex property expander', () => {
  describe('has one parameter', () => {
    it('should expand flex=none', () => {
      const result = transform`
        flex: none;
      `;

      expect(result).toMatchInlineSnapshot(`
        "
                flex-grow: 0;
                flex-shrink: 0;
                flex-basis: auto;
              "
      `);
    });

    it('should expand flex=initial', () => {
      const result = transform`
        flex: initial;
      `;

      expect(result).toMatchInlineSnapshot(`
        "
                flex-grow: 0;
                flex-shrink: 1;
                flex-basis: auto;
              "
      `);
    });

    it('should expand flex=auto', () => {
      const result = transform`
        flex: auto;
      `;

      expect(result).toMatchInlineSnapshot(`
        "
                flex-grow: 1;
                flex-shrink: 1;
                flex-basis: auto;
              "
      `);
    });

    it('should not expand flex=revert', () => {
      const result = transform`flex: revert;`;
      expect(result).toMatchInlineSnapshot(`"flex: revert;"`);
    });
    it('should not expand flex=revert-layer', () => {
      const result = transform`flex: revert-layer;`;
      expect(result).toMatchInlineSnapshot(`"flex: revert-layer;"`);
    });
    it('should not expand flex=unset', () => {
      const result = transform`flex: unset;`;
      expect(result).toMatchInlineSnapshot(`"flex: unset;"`);
    });
    it('should not expand flex=inherit', () => {
      const result = transform`flex: inherit;`;
      expect(result).toMatchInlineSnapshot(`"flex: inherit;"`);
    });

    it('should expand flex numbers', () => {
      const result = transform`
        flex: 2;
      `;

      expect(result).toMatchInlineSnapshot(`
        "
                flex-grow: 2;
                flex-shrink: 1;
                flex-basis: 0%;
              "
      `);
    });
  });

  describe('has two parameters', () => {
    it('should expand flex double shrink', () => {
      const result = transform`
        flex: 3 2;
      `;

      expect(result).toMatchInlineSnapshot(`
        "
                flex-grow: 3;
                flex-shrink: 2;
                flex-basis: 0%;
              "
      `);
    });

    it('should expand flex double basis', () => {
      const result = transform`
        flex: 3 20%;
      `;

      expect(result).toMatchInlineSnapshot(`
        "
                flex-grow: 3;
                flex-shrink: 1;
                flex-basis: 20%;
              "
      `);
    });
  });

  describe('has three parameters', () => {
    it('should expand flex triple', () => {
      const result = transform`
      flex: 3 2 20%;
    `;

      expect(result).toMatchInlineSnapshot(`
              "
                    flex-grow: 3;
                    flex-shrink: 2;
                    flex-basis: 20%;
                  "
          `);
    });

    it('should expand flex auto', () => {
      const result = transform`
      flex: 3 2 auto;
    `;

      expect(result).toMatchInlineSnapshot(`
              "
                    flex-grow: 3;
                    flex-shrink: 2;
                    flex-basis: auto;
                  "
          `);
    });

    it('should expand flex function call', () => {
      const result = transform`
      flex: 3 2 calc(50px + 50px);
    `;

      expect(result).toMatchInlineSnapshot(`
              "
                    flex-grow: 3;
                    flex-shrink: 2;
                    flex-basis: calc(50px + 50px);
                  "
          `);
    });

    it('should expand flex 0 basis', () => {
      const result = transform`
      flex: 1 1 0;
    `;

      expect(result).toMatchInlineSnapshot(`
              "
                    flex-grow: 1;
                    flex-shrink: 1;
                    flex-basis: 0%;
                  "
          `);
    });
  });

  describe('is invalid', () => {
    it('should remove decls for invalid single', () => {
      const result = transform`
      flex: asd;
    `;

      expect(result).toMatchInlineSnapshot(`
              "
                  "
          `);
    });

    it('should remove decls for invalid double', () => {
      const result = transform`
      flex: 1 asd;
    `;

      expect(result).toMatchInlineSnapshot(`
              "
                  "
          `);
    });

    it('should remove decls for invalid triple', () => {
      const result = transform`
      flex: 1 1 asdasd;
    `;

      expect(result).toMatchInlineSnapshot(`
              "
                  "
          `);
    });

    it('should remove decls for invalid triple again', () => {
      const result = transform`
      flex: 1 asdasd auto;
    `;

      expect(result).toMatchInlineSnapshot(`
              "
                  "
          `);
    });

    it('should remove invalid usage of triple', () => {
      const result = transform`
      flex: 1 1 1;
    `;

      expect(result).toMatchInlineSnapshot(`
          "
              "
      `);
    });
  });
});
