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

    expect(actual).toMatchInlineSnapshot(`"._1doq13q2{color:blue}"`);
  });

  it('should should atomicify multiple declarations', () => {
    const actual = transform`
      color: blue;
      font-size: 12px;
    `;

    expect(actual).toMatchInlineSnapshot(`"._1doq13q2{color:blue}._36l61fwx{font-size:12px}"`);
  });

  it('should autoprefix atomic rules', () => {
    process.env.BROWSERSLIST = 'Edge 16';

    const result = postcss([atomicifyRules(), whitespace, autoprefixer]).process(
      'user-select: none;',
      {
        from: undefined,
      }
    );

    expect(result.css).toMatchInlineSnapshot(`"._q4hxglyw{-ms-user-select:none;user-select:none}"`);
  });

  it('should callback with created class names', () => {
    const classes: string[] = [];
    const callback = (className: string) => {
      classes.push(className);
    };

    const result = postcss([atomicifyRules({ callback }), whitespace, autoprefixer]).process(
      'display:block;text-align:center;',
      {
        from: undefined,
      }
    );

    result.css;

    expect(classes).toMatchInlineSnapshot(`
      Array [
        "_dj7i1ule",
        "_o3nk1h6o",
      ]
    `);
  });

  it('should atomicify a nested tag rule', () => {
    const actual = transform`
      div {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._k2hc13q2 div{color:blue}"`);
  });

  it('should atomicify a nested tag rule', () => {
    const actual = transform`
      div {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._k2hc13q2 div{color:blue}"`);
  });

  it('should atomicify a nested pseudo rule', () => {
    const actual = transform`
      :hover {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._1uhh13q2:hover{color:blue}"`);
  });

  xit('should reference the atomic class with the self selector', () => {
    const actual = transform`
      &:hover {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._1uhh13q2:hover{color:blue}"`);
  });

  xit('should reference the atomic class with the self selector', () => {
    const actual = transform`
      :hover & {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._1uhh13q2 :hover{color:blue}"`);
  });

  it('should atomicify a double tag rule', () => {
    const actual = transform`
      div span {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._m59i13q2 div span{color:blue}"`);
  });

  it('should atomicify a double tag with pseudos rule', () => {
    const actual = transform`
      div:hover span:active {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._107g13q2 div:hover span:active{color:blue}"`);
  });

  it('should atomicify a nested tag pseudo rule', () => {
    const actual = transform`
      div:hover {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`"._5tvz13q2 div:hover{color:blue}"`);
  });

  it('should blow up if a doubly nested rule was found', () => {
    expect(() => {
      transform`
        div {
          div {
            font-size: 12px;
          }
        }
      `;
    }).toThrow('atomicify-rules: <css input>:3:11: Nested rules are not allowed.');
  });
});
