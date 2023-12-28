import postcss from 'postcss';

import { increaseSpecificity } from '../increase-specificity';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([increaseSpecificity()]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('increase specicifity plugin', () => {
  it('should increase specicifity of declared classes', () => {
    const actual = transform`
      .foo {}
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
            :not(#\\9) .foo {}
          "
    `);
  });

  it('should ignore atrules', () => {
    const actual = transform`
      @media {
        .foo {}
      }
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
            @media {
              :not(#\\9) .foo {}
            }
          "
    `);
  });

  it('should ignore root elements', () => {
    const actual = transform`
      html {}
      :root {}
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
            html {}
            :root {}
          "
    `);
  });
});
