import postcss from 'postcss';

import { mergeDuplicateAtRules } from '../merge-duplicate-at-rules';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([mergeDuplicateAtRules()]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('discard duplicate at-rule children plugin', () => {
  it('should remove duplicate children', () => {
    const actual = transform`
      @media (min-width:500px){._171dak0l{border:2px solid red}}
      @media (min-width:500px){._171dak0l{border:2px solid red}._1swkri7e:before{content:'large screen'}}
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
            @media (min-width:500px){._171dak0l{border:2px solid red}._1swkri7e:before{content:'large screen'}}
          "
    `);
  });

  it('should remove duplicate children with a different order', () => {
    const actual = transform`
    @media (min-width:500px){._171dak0l{border:2px solid red}._1swkri7e:before{content:'large screen'}}
      @media (min-width:500px){._171dak0l{border:2px solid red}}
    `;

    expect(actual).toMatchInlineSnapshot(`
      "
          @media (min-width:500px){._171dak0l{border:2px solid red}._1swkri7e:before{content:'large screen'}}
          "
    `);
  });
});
