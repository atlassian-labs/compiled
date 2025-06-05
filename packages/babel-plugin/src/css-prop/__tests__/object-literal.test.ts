import { transform as transformCode } from '../../test-utils';

describe('css prop object literal', () => {
  const transform = (code: string) => transformCode(code, { pretty: false });

  it('should inline the variable when it is a constant in string css', () => {
    const actual = transform(`
      import '@compiled/react';

      const bg = 'blue';
      let cl = 'red';
      cl = 'red';

      <div css={{ background: bg, color: cl, textDecoration: 'none', }}>hello world</div>
    `);

    expect(actual).toInclude('{background-color:blue');
    expect(actual).toInclude('{color:var(--_bo0rwa)');
    expect(actual).toInclude('text-decoration-line:none');
    expect(actual).toInclude('style={{"--_bo0rwa":ix(cl)}}');
  });

  it('should inline constant variable', () => {
    const actual = transform(`
      import '@compiled/react';

      const fontSize = 20;

      <div css={{ fontSize: \`\${fontSize}px\` }}>hello world</div>
    `);

    expect(actual).toInclude('{font-size:20px}');
  });

  it('should inline constant object property value', () => {
    const actual = transform(`
      import '@compiled/react';

      const colors = { error: 'red' };

      <div css={{ color: colors.error }}>hello world</div>
    `);

    expect(actual).toInclude('{color:red}');
  });

  it('should inline nested constant object property value', () => {
    const actual = transform(`
      import '@compiled/react';

      const theme = {
        colors: {
          light: {
            primary: '#fff',
          }
        }
      };

      <div css={{ color: theme.colors.light.primary }}>hello world</div>
    `);

    expect(actual).toInclude('{color:#fff}');
  });

  it('should persist suffix of dynamic property value from objects into inline styles', () => {
    const actual = transform(`
      import '@compiled/react';

      let heading = {
        depth: 20
      };
      heading = {};

      <div css={{ marginLeft: \`\${heading.depth}rem\`, color: 'red' }}>hello world</div>
    `);

    expect(actual).toInclude('{margin-left:var(--_5un9uz)}');
    expect(actual).toInclude('{color:red}');
    expect(actual).toInclude('style={{"--_5un9uz":ix(heading.depth,"rem")}}');
  });

  it('should persist prefix of dynamic property value into inline styles', () => {
    const actual = transform(`
      import '@compiled/react';

      let fontSize = 20;
      fontSize = 20;

      <div css={{ fontSize: \`calc(100% - \${fontSize}px)\`, color: 'red' }}>hello world</div>
    `);

    expect(actual).toInclude('{font-size:calc(100% - var(--_1j2e0s2))}');
    expect(actual).toInclude('{color:red}');
    expect(actual).toInclude('style={{"--_1j2e0s2":ix(fontSize,"px")}}');
  });

  it('should move prefix of grouped interpolation into inline styles', () => {
    const actual = transform(`
      import '@compiled/react';

      let heading = header || {
        depth: 20
      };

      <div css={{ marginLeft: \`calc(100% - \${heading.depth}rem)\` }}>hello world</div>
    `);

    expect(actual).toInclude('{margin-left:calc(100% - var(--_5un9uz))}');
    expect(actual).toInclude('style={{"--_5un9uz":ix(heading.depth,"rem")}}');
  });

  it('should move multiple groups of interpolations into inline styles', () => {
    // See: https://codesandbox.io/s/dank-star-443ps?file=/src/index.js
    const actual = transform(`
      import '@compiled/react';

      const N30 = 'gray';

      <div css={\`
        background-image: linear-gradient(45deg, \${N30} 25%, transparent 25%),
          linear-gradient(-45deg, \${N30} 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, \${N30} 75%),
          linear-gradient(-45deg, transparent 75%, \${N30} 75%);
      \`}>hello world</div>
    `);

    expect(actual).toInclude(
      'background-image:linear-gradient(45deg,gray 25%,transparent 25%),linear-gradient(-45deg,gray 25%,transparent 25%),linear-gradient(45deg,transparent 75%,gray 75%),linear-gradient(-45deg,transparent 75%,gray 75%)'
    );
  });

  it('should move multiple groups of interpolations into inline styles with css variable for dynamic value', () => {
    // See: https://codesandbox.io/s/dank-star-443ps?file=/src/index.js
    const actual = transform(`
      import '@compiled/react';

      let N30 = 'gray';
      N30 = 'gray';

      <div css={\`
        background-image: linear-gradient(45deg, \${N30} 25%, transparent 25%),
          linear-gradient(-45deg, \${N30} 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, \${N30} 75%),
          linear-gradient(-45deg, transparent 75%, \${N30} 75%);
      \`}>hello world</div>
    `);

    expect(actual).toInclude('style={{"--_1vrvste":ix(N30)}}');
    expect(actual).toInclude(
      'background-image:linear-gradient(45deg,var(--_1vrvste) 25%,transparent 25%),linear-gradient(-45deg,var(--_1vrvste) 25%,transparent 25%),linear-gradient(45deg,transparent 75%,var(--_1vrvste) 75%),linear-gradient(-45deg,transparent 75%,var(--_1vrvste) 75%)'
    );
  });

  it('should transform object with simple values', () => {
    const actual = transform(`
      import '@compiled/react';

      <div css={{ lineHeight: 20, color: 'blue' }}>hello world</div>
    `);

    expect(actual).toInclude('{line-height:20}');
    expect(actual).toInclude('{color:blue}');
  });

  it('should inline constant', () => {
    const actual = transform(`
      import '@compiled/react';

      const fontSize = 12;

      <div css={{ fontSize: \`\${fontSize}px\` }}>hello world</div>
    `);

    expect(actual).toInclude('{font-size:12px}');
  });

  it('should transform object with nested object into a selector', () => {
    const actual = transform(`
      import '@compiled/react';

      <div css={{ ':hover': { color: 'blue' } }}>hello world</div>
    `);

    expect(actual).toInclude(':hover{color:blue}');
  });

  it('should transform object that has a variable reference', () => {
    const actual = transform(`
      import '@compiled/react';

      let blue = 'blue';
      blue = 'blue';

      <div css={{ color: blue }}>hello world</div>
    `);

    expect(actual).toInclude('{color:var(--_13q2bts)}');
    expect(actual).toInclude('style={{"--_13q2bts":ix(blue)}}');
  });

  it('should transform object that has a destructured variable reference', () => {
    const actual = transform(`
      import '@compiled/react';
      import { useState } from 'react';

      const [color, setColor] = useState('blue');
      <div css={{ color }}>hello world</div>
    `);

    expect(actual).toInclude('style={{"--_1ylxx6h":ix(color)}}');
    expect(actual).toInclude('{color:var(--_1ylxx6h)}');
  });

  it('should transform object spread from variable', () => {
    const actual = transform(`
      import '@compiled/react';

      const mixin = { color: 'red' };

      <div css={{ color: 'blue', ...mixin }}>hello world</div>
    `);

    expect(actual).toInclude('{color:red}');
  });

  it('should transform object with string variable', () => {
    const actual = transform(`
      import '@compiled/react';

      const text = 'red';

      <div css={{ color: text }}>hello world</div>
    `);

    expect(actual).toInclude('{color:red}');
  });

  it('should transform object with string variable using shorthand notation', () => {
    const actual = transform(`
      import '@compiled/react';

      const color = 'red';

      <div css={{ color }}>hello world</div>
    `);

    expect(actual).toInclude('{color:red}');
  });

  it('should transform object with obj variable', () => {
    const actual = transform(`
      import '@compiled/react';

      const mixin = { color: 'red' };

      <div
        css={{
          display: 'flex',
          fontSize: '50px',
          color: 'blue',
          ':hover': mixin,
        }}>
        Hello, world!
      </div>
    `);

    expect(actual).toInclude('{display:flex}');
    expect(actual).toInclude('{font-size:50px}');
    expect(actual).toInclude('{color:blue}');
    expect(actual).toInclude(':hover{color:red}');
  });

  it('should transform object with no argument arrow function variable', () => {
    const actual = transform(`
      import '@compiled/react';

      const mixin = () => ({ color: 'red' });

      <div css={{ color: 'blue', ...mixin() }}>hello world</div>
    `);

    expect(actual).toInclude(`{color:red}`);
  });

  it('should transform object with argument arrow function variable', () => {
    const actual = transform(`
      import '@compiled/react';

      const color1 = 'black';
      const mixin = ({ color1, color2: c }, color3, radius) => ({
        color: color1,
        backgroundColor: c,
        borderColor: color3 ,
        borderRadius: radius,
      });

      const color = { red: 'red' };
      const greenColor = 'green';

      const Component = (props) => {
        const color2 = 'black';

        return <div css={{ ...mixin({ color1: color.red, color2: 'blue' }, greenColor, 10) }} />
      };
    `);

    expect(actual).toIncludeMultiple([
      '{color:red}',
      '{background-color:blue}',
      '{border-color:green}',
      '{border-radius:10px}',
    ]);
  });

  it('should transform object with unresolved argument arrow function variable', () => {
    const actual = transform(`
      import '@compiled/react';

      const radius = 10;
      const mixin = (color1, radius, size, weight) => ({
        color: color1,
        borderRadius: radius,
        fontSize: size,
        fontWeight: weight
      });

      const Component = (props) => <div css={{ ...mixin(props.color1, radius) }} />
    `);

    expect(actual).toIncludeMultiple([
      '{color:var(--_zo7lop)}',
      '"--_zo7lop":ix(props.color1)',
      '{border-radius:10px}',
      '{font-weight:var(--_u6vle4)}',
      '"--_u6vle4":ix()',
      '{font-size:var(--_kre2x8)}',
      '"--_kre2x8":ix()',
    ]);
  });

  it('should transform object with argument arrow function variable inside member expression', () => {
    const actual = transform(`
      import '@compiled/react';

      const mixin = {
        value: (color1, r, color2) => ({
          color: color1,
          borderRadius: r,
          borderColor: color2,
        })
      }

      const radius = 10;

      const Component = (props) => <div css={{ ...mixin.value(props.color1, radius, 'red') }} />
    `);

    expect(actual).toIncludeMultiple([
      '"--_zo7lop":ix(props.color1)',
      '{border-radius:10px}',
      '{border-color:red}',
    ]);
  });

  it('should transform template literal value', () => {
    const actual = transform(`
      import '@compiled/react';

      <div css={{ color: \`blue\` }}>hello world</div>
    `);

    expect(actual).toInclude(`{color:blue}`);
  });

  it('should transform object spread with no argument arrow function variable', () => {
    const actual = transform(`
      import '@compiled/react';

      const mixin = () => ({ color: 'red' });

      <div css={{ color: 'blue', ...mixin() }}>hello world</div>
    `);

    expect(actual).toInclude('{color:red}');
  });

  it('should transform inline template literal with suffix', () => {
    const actual = transform(`
      import '@compiled/react';

      const gridSize = 4;
      const Div = () => (
        <div
          css={{
            padding: \`0 \${gridSize}px\`,
            color: 'red',
          }}
        />
      );
    `);

    expect(actual).toInclude('{padding-left:4px}');
    expect(actual).toInclude('{padding-right:4px}');
    expect(actual).toInclude('{padding-top:0}');
    expect(actual).toInclude('{padding-bottom:0}');
    expect(actual).toInclude('{color:red}');
  });

  it('should transform object spread with no argument function variable', () => {
    const actual = transform(`
      import '@compiled/react';

      function mixin() {
        return { color: 'red' };
      }

      <div css={{ color: 'blue', ...mixin() }}>hello world</div>
    `);

    expect(actual).toInclude(`{color:red}`);
  });

  it('should transform object with no argument arrow function', () => {
    const actual = transform(`
      import '@compiled/react';

      const mixin = () => ({ color: 'red' });

      <div css={{ color: 'blue', ':hover': mixin() }}>hello world</div>
    `);

    expect(actual).toInclude(`{color:blue}`);
    expect(actual).toInclude(':hover{color:red}');
  });

  it('should transform object with no argument functions', () => {
    const actual = transform(`
      import '@compiled/react';

      const bgColor = 'blue';
      const fontStyling = {
        style: 'italic',
        family: 'sans-serif',
      };

      const mixin1 = () => ({ color: 'red', backgroundColor: bgColor });
      const mixin2 = function() { return { fontStyle: fontStyling.style } };
      function mixin3() { return { fontFamily: fontStyling.family } };

      <div css={{
        color: 'blue',
        ':hover': mixin1(),
        ...mixin2(),
        ...mixin3(),
      }}>
        hello world
      </div>
    `);

    expect(actual).toInclude(`{color:blue}`);
    expect(actual).toInclude(`{font-style:italic}`);
    expect(actual).toInclude(`{font-family:sans-serif}`);
    expect(actual).toInclude(':hover{color:red}');
    expect(actual).toInclude(':hover{background-color:blue}');
  });

  it('should transform object with no argument function properties belonging to a variable', () => {
    const actual = transform(`
      import '@compiled/react';

      const bgColor = 'blue';
      const fontSize = 12;
      const fontStyling = {
        weight: 500,
      };

      const sizes = {
        mixin1: () => \`1px solid \${bgColor}\`,
        mixin2: () => ({ fontSize }),
        mixin3: function() {return {fontWeight: fontStyling.weight};}
      };

      <div css={{
        color: 'blue',
        border: sizes.mixin1(),
        ...sizes.mixin2(),
        ...sizes.mixin3(),
      }}>
        hello world
      </div>
    `);

    expect(actual).toInclude(`{color:blue}`);
    expect(actual).toInclude(`{border:1px solid blue}`);
    expect(actual).toInclude(`{font-size:12px}`);
    expect(actual).toInclude(`font-weight:500}`);
  });

  it('should extract mixin from identifier', () => {
    const actual = transform(`
      import '@compiled/react';

      const base = { color: 'red' };

      <div css={base}>hello world</div>
    `);

    expect(actual).toInclude(`{color:red}`);
  });

  it('should extract collocated mixin from member expression', () => {
    const actual = transform(`
      import '@compiled/react';

      const styles = {
        default: {
          color: 'black'
        },
        success: {
          color: 'green'
        },
        fail: {
          color: 'red'
        }
      };

      <div css={styles.success}>hello world</div>
    `);

    expect(actual).toInclude(`{color:green}`);
  });

  it('should extract collocated mixin from deeply nested member expression', () => {
    const actual = transform(`
      import '@compiled/react';

      const styles = {
        list: {
          item: {
            layout: {
              display: 'flex'
            }
          }
        }
      };

      <div css={styles.list.item.layout}>hello world</div>
    `);

    expect(actual).toInclude(`{display:flex}`);
  });

  it('should transform identifier referencing an template literal', () => {
    const actual = transform(`
      import '@compiled/react';

      const base = \`
        color: red;
      \`;

      <div css={base}>hello world</div>
    `);

    expect(actual).toInclude(`{color:red}`);
  });

  it('should transform object with no argument function variable', () => {
    const actual = transform(`
      import '@compiled/react';

      function mixin() {
        return { color: 'red' };
      }

      <div css={{ color: 'blue', ':hover': mixin() }}>hello world</div>
    `);

    expect(actual).toInclude(`{color:blue}`);
    expect(actual).toInclude(':hover{color:red}');
  });

  it('should transform object spread with no argument function variable', () => {
    const actual = transform(`
      import '@compiled/react';

      function mixin() {
        return { color: 'red' };
      }

      <div css={{ color: 'blue', ...mixin() }}>hello world</div>
    `);

    expect(actual).toInclude('{color:red}');
  });

  it('should parse an inline string interpolation delimited by spaces', () => {
    const actual = transform(`
      import '@compiled/react';

      const gridSize = () => 8;
      const HORIZONTAL_SPACING = \`\${gridSize() / 2}px\`;

      <div css={{
        padding: \`0 \${HORIZONTAL_SPACING}\`,
        color: 'red',
       }}>hello world</div>
    `);

    expect(actual).toInclude('{padding:0 var(--_1xlms2h)}');
  });

  it('should parse an inline string interpolation delimited by multiple spaces', () => {
    const actual = transform(`
      import '@compiled/react';

      const gridSize = () => 8;
      const HORIZONTAL_SPACING = \`\${gridSize() / 2}px\`;

      <div css={{
        padding: \`0 \${HORIZONTAL_SPACING} 0 0\`,
        color: 'red',
       }}>hello world</div>
    `);

    expect(actual).toInclude('{padding:0 var(--_1xlms2h) 0 0}');
  });

  it('should parse an inline string interpolation delimited by multiple spaces and suffix', () => {
    const actual = transform(`
      import '@compiled/react';

      const gridSize = () => 8;
      const HORIZONTAL_SPACING = gridSize();

      <div css={{
        padding: \`0 \${HORIZONTAL_SPACING}px 0 0\`,
        color: 'red',
       }}>hello world</div>
    `);

    expect(actual).toInclude('{padding-top:0}');
    expect(actual).toInclude('{padding-right:8px}');
    expect(actual).toInclude('{padding-bottom:0}');
    expect(actual).toInclude('{padding-left:0}');
    expect(actual).toInclude('{color:red}');
  });

  it('should parse an inline string interpolation delimited by multiple spaces and multiple suffix', () => {
    const actual = transform(`
      import '@compiled/react';

      const gridSize = () => 8;
      const HORIZONTAL_SPACING = gridSize();

      <div css={{
        padding: \`\${HORIZONTAL_SPACING}px \${HORIZONTAL_SPACING}px \${HORIZONTAL_SPACING}px \${HORIZONTAL_SPACING}px\`,
        color: 'red',
       }}>hello world</div>
    `);

    expect(actual).toInclude('{padding-top:8px}');
    expect(actual).toInclude('{padding-right:8px}');
    expect(actual).toInclude('{padding-bottom:8px}');
    expect(actual).toInclude('{padding-left:8px}');
    expect(actual).toInclude('{color:red}');
  });

  it('should do nothing when content already has single quotes', () => {
    const actual = transform(`
      import '@compiled/react';

      const yeah = true;
      <div css={{ content: "'hello'" }}>hello world</div>
    `);

    expect(actual).toInclude(`{content:'hello'}`);
  });

  it('should do nothing when content already has double quotes', () => {
    const actual = transform(`
      import '@compiled/react';

      const yeah = true;
      <div css={{ content: '"hello"' }}>hello world</div>
    `);

    expect(actual).toInclude(`{content:\\\"hello\\\"}`);
  });

  it('should add quotations to static content if missing', () => {
    const actual = transform(`
      import '@compiled/react';

      const yeah = true;
      <div css={{ content: 'hello' }}>hello world</div>
    `);

    expect(actual).toInclude(`{content:\\\"hello\\\"}`);
  });

  it('should transform function returning an object', () => {
    const actual = transform(`
      import '@compiled/react';

      const color = 'red';
      const mixin = () => ({ color });

      <div css={{ color: mixin().color }}>hello world</div>
    `);

    expect(actual).toInclude('{color:red}');
  });

  it('should transform member expression referencing a function which returns an object', () => {
    const actual = transform(`
      import '@compiled/react';

      const color = 'red';
      const mixin = () => ({ color });

      const colors = mixin();

      <div css={{ color: colors.color }}>hello world</div>
    `);

    expect(actual).toInclude('{color:red}');
  });

  it('should transform the CSS call expression', () => {
    const actual = transform(`
      import { css } from '@compiled/react';

      const taggedObjectLiteralCss = css({
        color: 'purple',
      });

      <div css={taggedObjectLiteralCss}>hello world</div>
    `);

    expect(actual).toInclude('{color:purple}');
  });

  it('should transform the CSS call expression and traverse referenced variables', () => {
    const actual = transform(`
      import { css } from '@compiled/react';

      const backgroundColor = 'green';

      const taggedObjectLiteralCss = css({
        color: 'purple',
        backgroundColor,
      });

      <div css={taggedObjectLiteralCss}>hello world</div>
    `);

    expect(actual).toIncludeMultiple(['{color:purple}', '{background-color:green}']);
  });

  it('should transform the CSS call expression from member expression', () => {
    const actual = transform(`
      import { css } from '@compiled/react';

      const styles = {
        layout: {
          grid: {
            item: css({
              display: 'grid'
            })
          }
        }
      };

      const gridItem = styles.layout.grid.item;

      <div css={gridItem}>hello world</div>
    `);

    expect(actual).toInclude('{display:grid}');
  });

  it('should correctly expand shorthand property with ternary expression', () => {
    const actual = transform(`
    import { css } from '@compiled/react';

    const morePadding = true;

    <div css={{
        padding: morePadding ? "10px 20px 30px 40px" : "4px 8px",
    }}>
      Hello world
    </div>
    `);

    expect(actual).toMatchInlineSnapshot(`
      "import*as React from'react';import{ax,ix,CC,CS}from"@compiled/react/runtime";const _4="._19bv1ylp{padding-left:40px}";const _3="._n3td1ul9{padding-bottom:30px}";const _2="._u5f3gktf{padding-right:20px}";const _="._ca0q19bv{padding-top:10px}";const morePadding=true;<CC>
        <CS>{[_,_2,_3,_4]}</CS>
        {<div className={ax(["_ca0q19bv _u5f3gktf _n3td1ul9 _19bv1ylp"])}>
            Hello world
          </div>}
      </CC>;"
    `);
  });
});
