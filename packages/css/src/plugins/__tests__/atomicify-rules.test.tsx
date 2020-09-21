import postcss, { Plugin } from 'postcss';
import whitespace from 'postcss-normalize-whitespace';
import autoprefixer from 'autoprefixer';
import { atomicifyRules } from '../atomicify-rules';

const transform = (cssOrPlugins: TemplateStringsArray | Plugin<any>[]) => {
  const result = postcss([atomicifyRules(), whitespace]).process(cssOrPlugins[0], {
    from: undefined,
  });

  return result.css;
};

describe('atomicify rules', () => {
  it('should atomicify a single declaration', () => {
    const actual = transform`
      color: blue;
    `;

    expect(actual).toMatchInlineSnapshot(`"._17ab13q2{color:blue}"`);
  });

  it('should should atomicify multiple declarations', () => {
    const actual = transform`
      color: blue;
      font-size: 12px;
    `;

    expect(actual).toMatchInlineSnapshot(`"._17ab13q2{color:blue}._dsob1fwx{font-size:12px}"`);
  });

  it('should autoprefix atomic rules', () => {
    process.env.BROWSERSLIST = 'Edge 16';

    const result = postcss([atomicifyRules(), whitespace, autoprefixer]).process(
      'user-select: none;',
      {
        from: undefined,
      }
    );

    expect(result.css).toMatchInlineSnapshot(`"._1c5tglyw{-ms-user-select:none;user-select:none}"`);
  });
});
