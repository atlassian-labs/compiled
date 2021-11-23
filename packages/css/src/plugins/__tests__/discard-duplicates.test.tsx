import postcss from 'postcss';

import { discardDuplicates } from '../discard-duplicates';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([discardDuplicates()]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('discard dupicates plugin', () => {
  it('should do nothing if no duplicates', () => {
    expect(transform`
      display: block;
      margin: 0 auto;
    `).toMatchInlineSnapshot(`
      "
            display: block;
            margin: 0 auto;
          "
    `);
  });

  it('should discard duplicates', () => {
    expect(transform`
      display: block;
      display: flex;
    `).toMatchInlineSnapshot(`
      "
            display: flex;
          "
    `);
  });
});
