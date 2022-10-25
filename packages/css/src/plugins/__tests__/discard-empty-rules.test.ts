import postcss from 'postcss';

import { discardEmptyRules } from '../discard-empty-rules';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([discardEmptyRules()]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('discard empty rules plugin', () => {
  it('should omit rule with undefined value', () => {
    expect(transform`
      display: undefined;
      color: red;
    `).toMatchInlineSnapshot(`
      "
            color: red;
          "
    `);
  });

  it('should omit rule with null value', () => {
    expect(transform`
      display: null;
      color: red;
    `).toMatchInlineSnapshot(`
      "
            color: red;
          "
    `);
  });

  it('should omit rule with empty value', () => {
    expect(transform`
      display: ;
      color: red;
    `).toMatchInlineSnapshot(`
      "
            color: red;
          "
    `);
  });

  it('should omit rule inside selector', () => {
    expect(transform`
      :hover {        
        display: undefined;
        color: red;
      }
    `).toMatchInlineSnapshot(`
      "
            :hover {
              color: red;
            }
          "
    `);
  });

  it('should omit selector when no rules with values', () => {
    expect(transform`
      :hover {        
        display: undefined;
      }
    `).toMatchInlineSnapshot(`
      "
          "
    `);
  });
});
