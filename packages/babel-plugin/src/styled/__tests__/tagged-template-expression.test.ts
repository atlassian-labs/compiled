import { transform as transformCode } from '../../test-utils';
import type { TransformOptions } from '../../test-utils';

describe('styled tagged template expression', () => {
  const transform = (code: string, opts: TransformOptions = {}) =>
    transformCode(code, { snippet: true, ...opts });

  const enableTypescript: TransformOptions = {
    parserBabelPlugins: ['typescript', 'jsx'],
  };

  it('only transforms @compiled/react usages', () => {
    const actual = transform(`
      import { styled as styled2 } from '@compiled/react';
      import styled from 'styled-components';

      const StyledComponent = styled.div\`
        color: blue;
      \`;

      const CompiledComponent = styled2.div\`
        color: blue;
      \`;
    `);

    expect(actual).toMatchInlineSnapshot(`
      "const _ = "._syaz13q2{color:blue}";
      const StyledComponent = styled.div\`
        color: blue;
      \`;
      const CompiledComponent = forwardRef(
        ({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr) => {
          if (__cmplp.innerRef) {
            throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return (
            <CC>
              <CS>{[_]}</CS>
              <C
                {...__cmplp}
                style={__cmpls}
                ref={__cmplr}
                className={ax(["_syaz13q2", __cmplp.className])}
              />
            </CC>
          );
        }
      );
      "
    `);
  });

  it('only transforms @compiled/react usages when an invalid conditional expression is used elsewhere', () => {
    const actual = transform(`
      import { styled as styled2 } from '@compiled/react';
      import styled from 'styled-components';

      const fontSize = 16;

      const StyledComponent = styled.div\`
        font-size: \${fontSize}px;
        \${({ isPrimary }) => isPrimary && \`color: blue;\`}
      \`;

      const CompiledComponent = styled2.div\`
        font-size: \${fontSize}px;
      \`;
    `);

    expect(actual).toMatchInlineSnapshot(`
      "const _ = "._1wybexct{font-size:16px}";
      const fontSize = 16;
      const StyledComponent = styled.div\`
        font-size: \${fontSize}px;
        \${({ isPrimary }) => isPrimary && \`color: blue;\`}
      \`;
      const CompiledComponent = forwardRef(
        ({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr) => {
          if (__cmplp.innerRef) {
            throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return (
            <CC>
              <CS>{[_]}</CS>
              <C
                {...__cmplp}
                style={__cmpls}
                ref={__cmplr}
                className={ax(["_1wybexct", __cmplp.className])}
              />
            </CC>
          );
        }
      );
      "
    `);
  });

  it('should respect missing units', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div\`
        font-size: 12;
      \`;
    `);

    expect(actual).toInclude('{font-size:12}');
  });

  it('should not pass down invalid html attributes to the node when property has a suffix', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div\`
        font-size: \${props => props.textSize}px;
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '{font-size:var(--_8t6091)}',
      'const { textSize, ...__cmpldp } = __cmplp;',
      '"--_8t6091": ix(__cmplp.textSize, "px")',
    ]);
  });

  it('should use css mixins', () => {
    const actual = transform(`
      import { styled, css } from '@compiled/react';

      const big = \`font-size: 60px;\`;
      const color = { color: 'red' };
      const border = css\`border-left: 1px solid black\`;

      const ListItem = styled.div\`
        \${big};
        \${color};
        \${border};
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '{font-size:60px}',
      '{color:red}',
      '{border-left:1px solid black}',
    ]);
  });

  it('should be able to override properties in a mixin', () => {
    const actual = transform(`
      import { styled, css } from '@compiled/react';

      const primary = css\`
        font-size: 32px;
        font-weight: bold;
        color: purple;
      \`;

      const secondary = css\`
        border: 1px solid red;
      \`;

      const Component = styled.button\`
        \${primary};
        font-size: 30px;
        \${secondary};
        color: blue;
        border: 2px solid black;
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '{border:2px solid black}',
      '{color:blue}',
      '{font-size:30px}',
      '{font-weight:bold}',
    ]);
  });

  it('should inline constant numeric literal', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const fontSize = 20;

      const ListItem = styled.div\`
        font-size: \${fontSize}px;
      \`;
    `);

    expect(actual).toInclude('{font-size:20px}');
  });

  it('should move suffix to inline styles when referencing a mutable numeric literal', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      let fontSize = 20;
      fontSize = 19;

      const ListItem = styled.div\`
        font-size: \${fontSize}px;
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '{font-size:var(--_1j2e0s2)}',
      '"--_1j2e0s2": ix(fontSize, "px")',
    ]);
  });

  it('should move suffix to inline styles when referencing a mutable numeric literal when missing a semi colon', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      let fontSize = 20;
      fontSize = 19;

      const ListItem = styled.div\`
        font-size: \${fontSize}px
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '"--_1j2e0s2": ix(fontSize, "px")',
      '{font-size:var(--_1j2e0s2)}',
    ]);
  });

  it('should transform a static template literal', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude('{font-size:20px}');
  });

  it('should inline constant string literal', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const fontSize = '20px';

      const ListItem = styled.div\`
        font-size: \${fontSize};
      \`;
    `);

    expect(actual).toInclude('{font-size:20px}');
  });

  it('should transform template string literal with prop reference', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div\`
        color: \${props => props.color};
      \`;
    `);

    expect(actual).toIncludeMultiple(['{color:var(--_xexnhp)', '"--_xexnhp": ix(__cmplp.color)']);
  });

  it('should transform an arrow function with a body into an IIFE', () => {
    const code = `
      import { styled } from '@compiled/react';

      const ListItem = styled.div\`
        color: \${props => { return props.color; }};
      \`;
    `;

    const actual = transform(code, { pretty: false });

    expect(actual).toIncludeMultiple([
      '{color:var(--_63bh2t)}',
      '"--_63bh2t":ix((()=>{return __cmplp.color;})())',
    ]);
  });

  it('should transform an arrow function with a body into an IIFE by preventing passing down invalid html attributes to the node', () => {
    const code = `
      import { styled } from '@compiled/react';

      const ListItem = styled.div\`
        font-size: \${props => { return props.textSize; }};
      \`;
    `;

    const actual = transform(code, { pretty: false });

    expect(actual).toIncludeMultiple([
      '{font-size:var(--_1eiw442)}',
      'const{textSize,...__cmpldp}=__cmplp;',
      '"--_1eiw442":ix((()=>{return __cmplp.textSize;})())',
    ]);
  });

  it('should move suffix and prefix of a dynamic arrow function with a body into an IIFE', () => {
    const code = `
      import { styled } from '@compiled/react';

      const ListItem = styled.div\`
        content: "$\{props => { return props.color; }}";
      \`;
    `;

    const actual = transform(code, { pretty: false });

    expect(actual).toIncludeMultiple([
      '{content:var(--_63bh2t)}',
      '"--_63bh2t":ix((()=>{return __cmplp.color;})(),"\\"","\\"")',
    ]);
  });

  it('should move suffix and prefix of a dynamic arrow function with a body into an IIFE by preventing passing down invalid html attributes to the node', () => {
    const code = `
      import { styled } from '@compiled/react';

      const ListItem = styled.div\`
        content: "$\{props => { return props.textSize; }}";
      \`;
    `;

    const actual = transform(code, { pretty: false });

    expect(actual).toIncludeMultiple([
      '{content:var(--_1eiw442)}',
      'const{textSize,...__cmpldp}=__cmplp;',
      '"--_1eiw442":ix((()=>{return __cmplp.textSize;})(),"\\"","\\"")',
    ]);
  });

  it('should transform template string literal with obj variable', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const h200 = { fontSize: '12px' };

      const ListItem = styled.div\`
        \${h200};
        color: blue;
      \`;
    `);

    expect(actual).toIncludeMultiple(['{font-size:12px}', '{color:blue}']);
  });

  it('should resolve identifier pointing to a call expression if it returns simple value', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const em = (str) => str;
      const color = em('blue');

      const ListItem = styled.div\`
        color: \${color};
      \`;
    `);

    expect(actual).toInclude('{color:blue}');
  });

  it('should inline call if it returns simple value', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const em = (str) => str;

      const ListItem = styled.div\`
        color: \${em('blue')};
      \`;
    `);

    expect(actual).toInclude('{color:blue}');
  });

  it('should transform template string with no argument arrow function variable', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const mixin = () => ({ color: 'red' });

      const ListItem = styled.div\`
        font-size: 20px;
        border: 1px solid black;
        \${mixin()};
        background: white;
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '{font-size:20px}',
      '{border:1px solid black}',
      '{color:red}',
      '{background-color:white}',
    ]);
  });

  it('should transform template string with no argument arrow function variable when not called', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const mixin = () => ({ color: 'red' });

      const ListItem = styled.div\`
        border:1px solid black;
        \${mixin};
        background-color: white;
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '{border:1px solid black}',
      '{color:red}',
      'background-color:white',
    ]);
  });

  it('should transform template string with no argument functions', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const color = () => 'blue';
      const fontStyling = {
        style: 'italic',
        family: 'sans-serif',
      };

      const mixin1 = function() { return fontStyling.style; };
      function mixin2() { return fontStyling.family; };

      const ListItem = styled.div\`
        color: blue;
        font-style: \${mixin1()};
        font-family: \${mixin2()};
        :hover { background-color: \${color()} };
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '{color:blue}',
      '{font-style:italic}',
      '{font-family:sans-serif}',
      ':hover{background-color:blue}',
    ]);
  });

  it('should transform template string with no argument function properties belonging to a variable', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const color = () => 'blue';
      const fontSize = 12;
      const fontStyling = {
        weight: 500
      };

      const sizes = {
        mixin1: () => '1px solid black',
        mixin2: () => fontSize,
        mixin3: function() {return fontStyling.weight;}
      };

      const ListItem = styled.div\`
        color: blue;
        border: \${sizes.mixin1()};
        font-size: \${sizes.mixin2()}px;
        font-weight: \${sizes.mixin3()};
        :hover { background-color: \${color()} };
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '{color:blue}',
      '{border:1px solid black}',
      '{font-size:12px}',
      '{font-weight:500}',
      ':hover{background-color:blue}',
    ]);
  });

  it('should move suffix and prefix of a dynamic arrow func property into the style property', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div\`
        content: "$\{props => props.color}";
      \`;
    `);

    expect(actual).toInclude('"--_xexnhp": ix(__cmplp.color, \'"\', \'"\')');
  });

  it('should move any prefix of a dynamic arrow func property into the style property', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div\`
        content: "$\{props => props.color}";
      \`;
    `);

    expect(actual).toInclude('"--_xexnhp": ix(__cmplp.color, \'"\', \'"\')');
  });

  it('should move any suffix of a dynamic arrow func property into the style property', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div\`
        font-size: $\{props => props.color}px;
      \`;
    `);

    expect(actual).toInclude('"--_xexnhp": ix(__cmplp.color, "px")');
  });

  it('should move suffix and prefix of a dynamic property into the style property', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      let color = 'red';
      color = 'blue';

      const ListItem = styled.div\`
        content: "$\{color}";
        color: red;
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '{content:var(--_1ylxx6h)}',
      '"--_1ylxx6h": ix(color, \'"\', \'"\')',
    ]);
  });

  it('should do nothing with suffix/prefix when referencing constant literal', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const color = 'red';
      const ListItem = styled.div\`
        content: "$\{color}";
        color: red;
      \`;
    `);

    expect(actual).toInclude('{content:"red"}');
  });

  it('should transform template string with no argument function variable', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      function mixin() {
        return { color: 'red' };
      }

      const ListItem = styled.div\`
        border:1px solid black;
        \${mixin()};
        background: white;
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '{border:1px solid black}',
      '{color:red}',
      '{background-color:white}',
    ]);
  });

  it('should transform template string with argument arrow function variable', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const color1 = 'black';
      const mixin = ({ color1, color2: c }, color3, radius) => ({
        color: color1,
        backgroundColor: c,
        borderColor: color3 ,
        borderRadius: radius,
      });

      const color = { red: 'red' };
      const greenColor = 'green';

      const ListItem = styled.div\`
        font-size: 20px;
        \${mixin({ color1: color.red, color2: 'blue' }, greenColor, 10)};
        font-weight: bold;
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '{font-size:20px}',
      '{color:red}',
      '{background-color:blue}',
      '{border-color:green}',
      '{border-radius:10px}',
      '{font-weight:bold}',
    ]);
  });

  it('should transform template string with unresolved argument arrow function variable', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const radius = 10;
      const mixin = (color1, radius, size, weight) => ({
        color: color1,
        borderRadius: radius,
        fontSize: size,
        fontWeight: weight
      });

      const ListItem = styled.div\`
        background: white;
        \${mixin(props.color1, radius)};
        border: 1px solid black;
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '{background-color:white}',
      '{color:var(--_zo7lop)}',
      '"--_zo7lop": ix(props.color1)',
      '{border-radius:10px}',
      '{font-weight:var(--_u6vle4)}',
      '"--_u6vle4": ix()',
      '{font-size:var(--_kre2x8)}',
      '"--_kre2x8": ix()',
      '{border:1px solid black}',
    ]);
  });

  it('should transform template string with argument arrow function variable inside member expression', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const mixin = {
        value: (color1, r, color2) => ({
          color: color1,
          borderRadius: r,
          borderColor: color2
        })
      }

      const radius = 10;

      const ListItem = styled.div\`
        font-size: 20px;
        \${mixin.value(props.color1, radius, 'red')};
        font-weight: bold;
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '{font-size:20px}',
      '"--_zo7lop": ix(props.color1)',
      '{border-radius:10px}',
      '{border-color:red}',
      '{font-weight:bold}',
    ]);
  });

  it('should only destructure a prop if hasnt been already', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div\`
        \${(props) =>
          props.isPrimary
            ? \`
              color: green;
              > :first-child {
                display: \${(props) => (props.isShown ? 'none' : 'block')};
              }

              > :last-child {
                opacity: \${(props) => (props.isShown ? 1 : 0)};
              }
            \`
          : 'color: red'};
      \`
    `);

    // `isShown` should be destructured only once.
    expect(actual).toInclude('const { isPrimary, isShown, ...__cmpldp } = __cmplp;');
  });

  it('should transform identifier referencing an expression with suffix', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      let br = 2 + 2;
      br += br;

      const Div = styled.div\`
        border-radius: \${br}px;
        color: red;
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '{border-radius:var(--_1hwymmh)}',
      '"--_1hwymmh": ix(br, "px")',
    ]);
  });

  it('should transform inline arrow function with suffix', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const getBr = () => 4;
      const Div = styled.div\`
        border-radius: \${getBr}px;
        color: red;
      \`;
    `);

    expect(actual).toIncludeMultiple(['{border-radius:4px}', '{color:red}']);
  });

  it('should transform arrow function call that returns css like object', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const getBr = () => ({ fontSize: 12 });
      const Div = styled.div\`
        \${getBr()};
        color: red;
      \`;
    `);

    expect(actual).toIncludeMultiple(['{font-size:12px}', '{color:red}']);
  });

  it('should transform arrow function call that returns number', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const getBr = () => 12;
      const Div = styled.div\`
        font-size: \${getBr()}px;
        color: red;
      \`;
    `);

    expect(actual).toIncludeMultiple(['{font-size:12px}', '{color:red}']);
  });

  it('should transform arrow function call that has a complex body', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const getBr = () => {
        return true ? '1' : '2';
      };
      const Div = styled.div\`
        font-size: \${getBr()}px;
        color: red;
      \`;
    `);

    expect(actual).toIncludeMultiple(['{font-size:1px}', '{color:red}']);
  });

  it('should transform function returning an object', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const color = 'red';
      const mixin = () => ({ color });

      const ListItem = styled.div\`
        color: \${mixin().color};
      \`;
    `);

    expect(actual).toInclude('{color:red}');
  });

  it('should transform member expression referencing a function which returns an object', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const color = 'red';
      const mixin = () => ({ color });

      const colors = mixin();

      const ListItem = styled.div\`
        color: \${colors.color};
      \`;
    `);

    expect(actual).toInclude('{color:red}');
  });

  // This may seem unusual, but this occurs when @atlaskit/tokens (as of
  // writing - v1.0.0) runs before @compiled/babel-plugin. @atlaskit/tokens'
  // babel plugin will convert something like
  //     ${token('color.background.accent.gray.subtler', colors.N20A)}
  // to
  //     ${`var(--ds-background-accent-gray-subtler, ${colors.N20A})`}
  it('should transform variable within a nested template literal', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const color = 'red';

      const ListItem = styled.div\`
        color: \${\`var(--my-variable, \${color})\`};
      \`;
    `);

    expect(actual).toInclude('{color:var(--my-variable,red)}');
  });

  it('should transform variable within a nested template literal in hover selector', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const color = 'red';

      const ListItem = styled.div\`
        &:hover {
          background-color: \${\`var(--my-variable, \${color})\`};
        }
      \`;
    `);

    expect(actual).toInclude(':hover{background-color:var(--my-variable,red)}');
  });

  it('should transform variables within nested template literals in two properties', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const color = 'red';
      const color2 = 'blue';
      const gridSize = 50;

      const ListItem = styled.div\`
        top: 5px;
        right: \${gridSize}px;
        color: \${\`var(--my-variable, \${color})\`};
        border: 1px solid ${`var(--ds-border, \${color2})`};
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '{top:5px}',
      '{right:50px}',
      '{color:var(--my-variable,red)}',
      '{border:1px solid var(--ds-border,blue)}',
    ]);
  });

  it('should transform variables within nested template literals within the same property', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const color = 'red';
      const color2 = 'blue';

      const ListItem = styled.div\`
        background: linear-gradient(
            \${\`var(--my-variable, \${color})\`},
            \${\`var(--my-other-variable, \${color2})\`}
        );
      \`;
    `);

    expect(actual).toInclude(
      '{background:linear-gradient(var(--my-variable,red),var(--my-other-variable,blue))}'
    );
  });

  it('should transform variable within a heavily nested template literal', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const color = 'red';
      const interpolation = \`1px solid \${\`var(--my-variable, \${color})\`}\`;

      const ListItem = styled.div\`
        border: \${interpolation};
      \`;
    `);

    expect(actual).toInclude('{border:1px solid var(--my-variable,red)}');
  });

  it('should handle destructuring in interpolation functions', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';
      import colors from 'colors';

      export const BadgeSkeleton = styled.span\`
      \${(props) =>
        props.isPrimary
          ? \`
            background-color: \${({ isLoading }) => (isLoading ? colors.N20 : colors.N40)};
            color: \${({ loading: l }) => (l ? colors.N50 : colors.N10)};
            border-color: \${(propz) => (propz.loading ? colors.N100 : colors.N200)};
          \` : 'color: black'
        };
      \`;
    `);

    expect(actual).not.toInclude('propz.loading?colors.N100:colors.N200');

    expect(actual).toIncludeMultiple([
      '__cmplp.isLoading ? colors.N20 : colors.N40',
      '__cmplp.loading ? colors.N50 : colors.N10',
      '__cmplp.loading ? colors.N100 : colors.N200',
    ]);
  });

  // For the next two test cases, the value of color and background-color
  // cannot be statically evaluated, so the value gets extracted into
  // the HTML style attribute

  it('should transform variable within a template literal within an interpolation function', () => {
    const actual = transform(
      `
      import { styled } from '@compiled/react';

      const color = 'red';
      const color2 = 'blue';

      const ListItem = styled.div<{ ruleEnabled: boolean }>\`
        color: \${({ ruleEnabled }) =>
          (ruleEnabled ? color : \`var(--my-variable, \${color2})\`)};
      \`;
    `,
      enableTypescript
    );

    expect(actual).toMatchInlineSnapshot(`
      "const _2 = "._syazj09m{color:var(--my-variable,blue)}";
      const _ = "._syaz5scu{color:red}";
      const color = "red";
      const color2 = "blue";
      const ListItem = forwardRef(
        ({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr) => {
          if (__cmplp.innerRef) {
            throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          const { ruleEnabled, ...__cmpldp } = __cmplp;
          return (
            <CC>
              <CS>{[_, _2]}</CS>
              <C
                {...__cmpldp}
                style={__cmpls}
                ref={__cmplr}
                className={ax([
                  "",
                  __cmplp.ruleEnabled ? "_syaz5scu" : "_syazj09m",
                  __cmplp.className,
                ])}
              />
            </CC>
          );
        }
      );
      "
    `);
  });

  it('should transform variables within nested template literals that are all in an interpolation function', () => {
    // this aims to represent the following use case:
    //     background-color: ${({ isActive }) =>
    //         `${
    //             isActive
    //                 ? `${token('some.token', color)}`
    //                 : `${token('some.other.token', color2)}`
    //         }`
    //     };
    //
    // after token(...) has been processed by the babel plugin in
    // @atlaskit/tokens (as of @atlaskit/tokens v1.0.0)
    const actual = transform(
      `
      import { styled } from '@compiled/react';

      const color = 'red';
      const color2 = 'blue';

      const ListItem = styled.div<{ isActive: boolean }>\`
        background-color: \${({ isActive }) =>
          \`\${
            isActive
              ? \`\${\`var(--my-variable, \${color})\`}\`
              : \`\${\`var(--my-other-variable, \${color2})\`}\`
          }\`
        };
      \`;
    `,
      enableTypescript
    );

    expect(actual).toMatchInlineSnapshot(`
      "const _ = "._bfhkkqce{background-color:var(--_hudwc7)}";
      const color = "red";
      const color2 = "blue";
      const ListItem = forwardRef(
        ({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr) => {
          if (__cmplp.innerRef) {
            throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          const { isActive, ...__cmpldp } = __cmplp;
          return (
            <CC>
              <CS>{[_]}</CS>
              <C
                {...__cmpldp}
                style={{
                  ...__cmpls,
                  "--_hudwc7": ix(
                    \`\${
                      __cmplp.isActive
                        ? \`\${\`var(--my-variable, \${color})\`}\`
                        : \`\${\`var(--my-other-variable, \${color2})\`}\`
                    }\`
                  ),
                }}
                ref={__cmplr}
                className={ax(["_bfhkkqce", __cmplp.className])}
              />
            </CC>
          );
        }
      );
      "
    `);
  });

  it('should place classes in given order when static styles precede expression', () => {
    const actual = transform(`
      import { styled, keyframes } from '@compiled/react';
      import colors from 'colors';

      const color = { color: colors.color };

      const ListItem = styled.div\`
        font-size: 20px;
        border-radius: 3px;
        \${color};
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._1wybgktf{font-size:20px}',
      '._2rko1l7b{border-radius:3px}',
      '._syaz1qjj{color:var(--_pvyxdf)}',
      '{ax(["_2rko1l7b _1wybgktf _syaz1qjj", __cmplp.className])}',
    ]);
  });

  it('should place classes in given order when expression precedes static styles', () => {
    const actual = transform(`
      import { styled, keyframes } from '@compiled/react';
      import colors from 'colors';

      const color = { color: colors.color };

      const ListItem = styled.div\`
        \${color};
        font-size: 20px;
        border-radius: 3px;
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._syaz1qjj{color:var(--_pvyxdf)}',
      '._1wybgktf{font-size:20px}',
      '._2rko1l7b{border-radius:3px}',
      '{ax(["_2rko1l7b _syaz1qjj _1wybgktf", __cmplp.className])}',
    ]);
  });
});
