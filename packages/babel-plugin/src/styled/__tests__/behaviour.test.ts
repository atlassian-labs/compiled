import type { TransformOptions } from '../../test-utils';
import { transform as transformCode } from '../../test-utils';

describe('styled component behaviour', () => {
  beforeAll(() => {
    process.env.AUTOPREFIXER = 'off';
  });

  afterAll(() => {
    delete process.env.AUTOPREFIXER;
  });

  const transform = (code: string, opts: TransformOptions = {}) =>
    transformCode(code, { pretty: false, ...opts });

  it('should generate styled object call expression component code', () => {
    const code = `
      import { styled } from '@compiled/react';

      const ListItem = styled.div({
        fontSize: '20px',
      });
    `;

    const actual = transform(code, { pretty: true });

    expect(actual).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ = "._4ya3eESPN1{font-size:20px}";
      const ListItem = forwardRef(
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
                className={ax(["_4ya3eESPN1", __cmplp.className])}
              />
            </CC>
          );
        }
      );
      if (process.env.NODE_ENV !== "production") {
        ListItem.displayName = "ListItem";
      }
      "
    `);
  });

  it('should generate styled tagged template expression component code', () => {
    const code = `
      import { styled } from '@compiled/react';

      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `;

    const actual = transform(code, { pretty: true });

    expect(actual).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ = "._4ya3eESPN1{font-size:20px}";
      const ListItem = forwardRef(
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
                className={ax(["_4ya3eESPN1", __cmplp.className])}
              />
            </CC>
          );
        }
      );
      if (process.env.NODE_ENV !== "production") {
        ListItem.displayName = "ListItem";
      }
      "
    `);
  });

  it('should add an identifier nonce to the style element', () => {
    const code = `
      import { styled } from '@compiled/react';

      const ListItem = styled.div\`
        font-size: \${props => props.color}px;
      \`;
    `;

    const actual = transform(code, { nonce: '__webpack_nonce__' });

    expect(actual).toInclude('<CS nonce={__webpack_nonce__}');
  });

  it('should compose CSS from multiple sources', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const styles = { fontSize: 12 };

      const ListItem = styled.div([
        styles,
        \`color: blue;\`,
        { fontWeight: 500 }
      ]);
    `);

    expect(actual).toIncludeMultiple(['{font-size:12px}', '{color:blue}', '{font-weight:500}']);
  });

  it('should not destructure valid html attributes from props', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.font({
        color: props => props.color,
      });
    `);

    expect(actual).toIncludeMultiple(['"--_xexnhp":ix(__cmplp.color)', '<C{...__cmplp}']);
    expect(actual).not.toInclude('const{color, ...__cmpldp}=__cmplp;');
  });

  it('should destructure invalid html attributes from props', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div({
        fontSize: props => props.textSize,
        color: props => props.color,
      });
    `);

    expect(actual).toIncludeMultiple([
      'const{textSize,...__cmpldp}=__cmplp;',
      '"--_8t6091":ix(__cmplp.textSize)',
      '<C{...__cmpldp}',
    ]);
  });

  it('should shortcircuit props with suffix to a empty string to avoid undefined in css', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div\`
        font-size: \${props => props.textSize}px;
      \`;
    `);

    expect(actual).toInclude('"--_8t6091":ix(__cmplp.textSize,"px")');
  });

  it('should prefix interpolation', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div\`
        font-size: -\${props => props.textSize}px;
      \`;
    `);

    expect(actual).toInclude('"--_8t6091-":ix(__cmplp.textSize,"px","-")');
  });

  it('creates a separate var name for positive and negative values of the same interpolation', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';
      const random = Math.random;

      const LayoutRight = styled.aside\`
        margin-right: -\${random() * 5}px;
        margin-left: \${random() * 5}px;
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._0adFHs8SIF{margin-right:var(--_1hnpmp1-)}',
      '._2XsHFMLg0e{margin-left:var(--_1hnpmp1)}',
      '"--_1hnpmp1-":ix(random()*5,"px","-")',
      '"--_1hnpmp1":ix(random()*5,"px")',
      'ax(["_0adFHs8SIF _2XsHFMLg0e",__cmplp.className]',
    ]);
  });

  it('should compose a component using tagged template expression', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div\`
        color: red;
      \`;

      const ListItem = styled(Component)\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toIncludeMultiple(['as:C=Component', '<C{...__cmplp}']);
  });

  it('should compose a component using object call expression', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div({
        color: 'red',
      });

      const ListItem = styled(Component)({
        fontSize: 20
      });
    `);

    expect(actual).toIncludeMultiple(['as:C=Component', '<C{...__cmplp}']);
  });

  it('should inline constant identifier string literal', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const fontSize = '20px';

      const ListItem = styled.div\`
        font-size: \${fontSize};
      \`;
    `);

    expect(actual).toInclude('{font-size:20px}');
  });

  it('should transform an arrow function with a body into an IIFE', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div({
        color: props => { return props.color; },
      });
    `);

    expect(actual).toIncludeMultiple([
      '{color:var(--_63bh2t)}',
      '"--_63bh2t":ix((()=>{return __cmplp.color;})())',
    ]);
  });

  it('should transform an arrow function with a body into an IIFE by preventing passing down invalid html attributes to the node', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div({
        fontSize: props => { return props.textSize; },
      });
    `);

    expect(actual).toIncludeMultiple([
      '{font-size:var(--_1eiw442)}',
      'const{textSize,...__cmpldp}=__cmplp;',
      '"--_1eiw442":ix((()=>{return __cmplp.textSize;})())',
    ]);
  });

  it('should move suffix and prefix of a dynamic arrow function with a body into an IIFE', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div({
        content: \`"$\{props => { return props.color; }}"\`
      });
    `);

    expect(actual).toIncludeMultiple([
      '{content:var(--_63bh2t)}',
      '"--_63bh2t":ix((()=>{return __cmplp.color;})(),"\\"","\\"")',
    ]);
  });

  it('should collect args as styles', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div(
        { color: 'darkorchid' },
        { fontSize: 12 },
      );
    `);

    expect(actual).toIncludeMultiple([
      '{color:darkorchid}',
      '{font-size:12px}',
      'ax(["_1UtDYzPXoT _4ya3eErjyG",__cmplp.className])',
    ]);
  });

  it('should not throw when template literal CSS has no terminating semicolon', () => {
    expect(() => {
      transform(`
        import { styled } from '@compiled/react';

        const ListItem = styled.div(
          \`color: red\`,
          { fontSize: 20 }
        );
      `);
    }).not.toThrow();
  });

  it('should handle destructuring in interpolation functions', () => {
    const code = `
      import { styled } from '@compiled/react';
      import colors from 'colors';

      export const BadgeSkeleton = styled.span\`
        background-color: \${({ isLoading }) => (isLoading ? colors.N20 : colors.N40)};
        color: \${({ loading: l }) => (l ? colors.N50 : colors.N10)};
        border-color: \${(propz) => (propz.loading ? colors.N100 : colors.N200)};
        display: \${({ state: { loading } }) => loading ? 'none' : 'inherit'};
        opacity: \${({ width, ...rest }) => rest.isLoading ? 0 : 1};
      \`;
    `;

    const actual = transform(code, { pretty: true });

    expect(actual).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      import colors from "colors";
      const _0 = "._1YKVNs7dHp{opacity:1}";
      const _9 = "._1YKVNsdnbC{opacity:0}";
      const _8 = "._3iDTPbOLYo{display:inherit}";
      const _7 = "._3iDTPbYbGa{display:none}";
      const _6 = "._3vBAKHJ3AW{border-color:var(--_96ptk)}";
      const _5 = "._3vBAKH5L05{border-color:var(--_5rpikm)}";
      const _4 = "._1UtDYzS68z{color:var(--_1oii75x)}";
      const _3 = "._1UtDYzT6Pb{color:var(--_1ytezyk)}";
      const _2 = "._0KLXruGOWH{background-color:var(--_kcgnsd)}";
      const _ = "._0KLXruZK1F{background-color:var(--_16ldrz5)}";
      export const BadgeSkeleton = forwardRef(
        ({ as: C = "span", style: __cmpls, ...__cmplp }, __cmplr) => {
          if (__cmplp.innerRef) {
            throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          const { isLoading, state, ...__cmpldp } = __cmplp;
          return (
            <CC>
              <CS>{[_, _2, _3, _4, _5, _6, _7, _8, _9, _0]}</CS>
              <C
                {...__cmpldp}
                style={{
                  ...__cmpls,
                  "--_16ldrz5": ix(colors.N20),
                  "--_kcgnsd": ix(colors.N40),
                  "--_1ytezyk": ix(colors.N50),
                  "--_1oii75x": ix(colors.N10),
                  "--_5rpikm": ix(colors.N100),
                  "--_96ptk": ix(colors.N200),
                }}
                ref={__cmplr}
                className={ax(["", __cmplp.isLoading ? "_0KLXruZK1F" : "_0KLXruGOWH", __cmplp.loading ? "_1UtDYzT6Pb" : "_1UtDYzS68z", __cmplp.loading ? "_3vBAKH5L05" : "_3vBAKHJ3AW", __cmplp.state.loading ? "_3iDTPbYbGa" : "_3iDTPbOLYo", __cmplp.isLoading ? "_1YKVNsdnbC" : "_1YKVNs7dHp", __cmplp.className])}
              />
            </CC>
          );
        }
      );
      if (process.env.NODE_ENV !== "production") {
        BadgeSkeleton.displayName = "BadgeSkeleton";
      }
      "
    `);
  });

  it('should handle an animation that references an inline @keyframes', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div\`
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          to {
            opacity: 0;
          }
        }

        animation: fadeOut 2s ease-in-out;
      \`;
    `);

    expect(actual).toIncludeMultiple([
      'const _="._2fBhtekqVl{animation:fadeOut 2s ease-in-out}"',
      'const _2="@keyframes fadeOut{0%{opacity:1}50%{opacity:0.5}to{opacity:0}}"',
      '<CS>{[_,_2]}</CS>',
      'className={ax(["_2fBhtekqVl",__cmplp.className])}',
    ]);
  });

  it('should not blow up with an expanding property', () => {
    expect(() =>
      transform(`
        import { styled } from '@compiled/react';

        export const BoardContent = styled.span\`
          flex: 1;
        \`;
      `)
    ).not.toThrow();
  });

  it('should omit classes on rules with no value in string literal', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div\`
        color: ;
        background-color: undefined;
        border-color: null;

        ::after {
          content: '';
        }
      \`;
    `);

    expect(actual).toIncludeMultiple([
      "_0GBAIrmjHx:after{content:''}",
      'className={ax(["_0GBAIrmjHx",__cmplp.className])}',
    ]);
  });

  it('should omit classes on rules with no value in object', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div({
        color: '',
        backgroundColor: undefined,
        borderColor: null,
        '::after': {
          content: '',
        }
      });
    `);

    expect(actual).toIncludeMultiple([
      '_0GBAIrogpp:after{content:\\"\\"}',
      'className={ax(["_0GBAIrogpp",__cmplp.className])}',
    ]);
  });

  it('should apply no classes when styles have no value inside selector', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div({
        ':hover': {
          fontSize: undefined,
        }
      });
    `);

    expect(actual).toInclude('className={ax(["",__cmplp.className])}');
  });

  it('should omit styles with no value inside selector', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div({
        ':hover': {
          color: 'red',
          fontSize: undefined,
        }
      });
    `);

    expect(actual).toIncludeMultiple([
      '._0clgaMGowl:hover{color:red}',
      'className={ax(["_0clgaMGowl",__cmplp.className])}',
    ]);
  });

  it('should apply conditional CSS with ternary operator', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.button\`
        color: \${(props) => (props.isPrimary ? 'blue' : 'red')};
        /* annoying-comment */ text-decoration-line: \${({ isDone }) => isDone ? 'line-through' : 'none'};
        -webkit-line-clamp: \${({ isClamped }) => isClamped ? 3 : 1};
        font-size: 30px;
        border: 2px solid blue;
        padding: 8px;
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._1UtDYzGowl{color:red}',
      '._1UtDYzynoA{color:blue}',
      '._3xtjKNgje0{text-decoration-line:line-through}',
      '._3xtjKNYbGa{text-decoration-line:none}',
      '._4Gn54R7LI7{-webkit-line-clamp:3}',
      '._4Gn54R7dHp{-webkit-line-clamp:1}',
      '._2Zuz6QJg58{padding-left:8px}',
      '._1wydGWJg58{padding-bottom:8px}',
      '._1ZnuxbJg58{padding-right:8px}',
      '._0Of8r2Jg58{padding-top:8px}',
      '._30huDKFhCC{border:2px solid blue}',
      '._4ya3eEuNcX{font-size:30px}',
      'ax(["_30huDKFhCC _0Of8r2Jg58 _1ZnuxbJg58 _1wydGWJg58 _2Zuz6QJg58 _4ya3eEuNcX",__cmplp.isPrimary?"_1UtDYzynoA":"_1UtDYzGowl",__cmplp.isDone?"_3xtjKNgje0":"_3xtjKNYbGa",__cmplp.isClamped?"_4Gn54R7LI7":"_4Gn54R7dHp",__cmplp.className])',
    ]);
  });

  it('should apply conditional CSS with ternary operators and suffix', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div\`
        border-radius: \${(props) => props.isRounded ? 10 : 1}px !important;
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._0bjKvDNKBH{border-radius:10px!important}',
      '._0bjKvDnQo4{border-radius:1px!important}',
      `ax([\"\",__cmplp.isRounded?\"_0bjKvDNKBH\":\"_0bjKvDnQo4\",__cmplp.className])`,
    ]);
  });

  it('should apply conditional CSS with ternary operator for object styles', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.button({
        color: (props) => (props.isPrimary ? 'blue' : 'red'),
        marginLeft: \`\${({ isLast }) => isLast ? 5 : 10}px\`,
        marginRight: ({ isLast }) => \`\${isLast ? 5 : 10}px\`,
      });
    `);

    expect(actual).toIncludeMultiple([
      '._1UtDYzGowl{color:red}',
      '._1UtDYzynoA{color:blue}',
      '._2XsHFMyrFs{margin-left:5px}',
      '._2XsHFMuFDC{margin-left:10px}',
      '._0adFHsyrFs{margin-right:5px}',
      '._0adFHsuFDC{margin-right:10px}',
      'ax(["",__cmplp.isPrimary?"_1UtDYzynoA":"_1UtDYzGowl",__cmplp.isLast?"_2XsHFMyrFs":"_2XsHFMuFDC",__cmplp.isLast?"_0adFHsyrFs":"_0adFHsuFDC",__cmplp.className])',
    ]);
  });

  it('should apply conditional CSS with ternary operator and tagged templates branches', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.button\`
        color: \${(props) => (props.isPrimary ? \`blue\` : \`red\`)};
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._1UtDYzGowl{color:red}',
      '._1UtDYzynoA{color:blue}',
      `ax([\"\",__cmplp.isPrimary?\"_1UtDYzynoA\":\"_1UtDYzGowl\",__cmplp.className])`,
    ]);
  });

  it('should apply conditional CSS with ternary operators, template literal branches containing props', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';
      import { CUSTOM_WIDTH } from './constants';

      const ListItem = styled.div\`
        width: \${(props) => props.useCustomWidth ? \`\${CUSTOM_WIDTH}px\` : '100%'};
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._39xV02N91d{width:100%}',
      '._39xV02os7J{width:var(--_znisgh)}',
      'style={{...__cmpls,"--_znisgh":ix(CUSTOM_WIDTH,"px")}}',
      `ax([\"\",__cmplp.useCustomWidth?\"_39xV02os7J\":\"_39xV02N91d\",__cmplp.className])`,
    ]);
  });

  it('should apply conditional CSS with multiple ternary operators', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.button\`
        color: \${(props) => (props.isPrimary ? 'blue' : 'red')};
        border: \${(props) => (props.isPrimary ? '1px solid blue' : '1px solid red')};
        font-size: 30px;
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._30huDK9HCG{border:1px solid red}',
      '._30huDKEM5s{border:1px solid blue}',
      '._1UtDYzGowl{color:red}',
      '._1UtDYzynoA{color:blue}',
      '._4ya3eEuNcX{font-size:30px}',
      `ax([\"_4ya3eEuNcX\",__cmplp.isPrimary?\"_1UtDYzynoA\":\"_1UtDYzGowl\",__cmplp.isPrimary?\"_30huDKEM5s\":\"_30huDK9HCG\",__cmplp.className]`,
    ]);
  });

  it('should apply conditional CSS with nested ternary operators', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.button\`
        color: \${(props) => (props.isPrimary ? props.isDisabled ? 'black' : 'blue' : 'red')};
        font-size: 30px;
        border: 2px solid blue;
        padding: 8px;
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._2Zuz6QJg58{padding-left:8px}',
      '._1wydGWJg58{padding-bottom:8px}',
      '._1ZnuxbJg58{padding-right:8px}',
      '._0Of8r2Jg58{padding-top:8px}',
      '._30huDKFhCC{border:2px solid blue}',
      '._4ya3eEuNcX{font-size:30px}',
      '._1UtDYzGowl{color:red}',
      '._1UtDYzynoA{color:blue}',
      '._1UtDYzbqW0{color:black}',
      `ax([\"_30huDKFhCC _0Of8r2Jg58 _1ZnuxbJg58 _1wydGWJg58 _2Zuz6QJg58 _4ya3eEuNcX\",__cmplp.isPrimary?__cmplp.isDisabled?\"_1UtDYzbqW0\":\"_1UtDYzynoA\":\"_1UtDYzGowl\",__cmplp.className])`,
    ]);
  });

  it('should apply conditional CSS with template literal', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div\`
        color: red;
        background: white;
        border: 3px solid yellow;
        \${props => props.isPrimary && ({ color: 'blue' })};
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._1UtDYzynoA{color:blue}',
      '._30huDKoshS{border:3px solid yellow}',
      '._0KLXruaJpK{background-color:white}',
      '._1UtDYzGowl{color:red}',
      'className={ax(["_0KLXruaJpK _30huDKoshS _1UtDYzGowl",__cmplp.isPrimary&&"_1UtDYzynoA",__cmplp.className])}',
    ]);
  });

  it('should apply conditional CSS with template literal and nested ternary operators', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div\`
        background: white;
        \${props => props.isPrimary ? props.isDisabled ? { color: 'black' } : { color: 'blue' } : { color: 'red' }};
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._0KLXruaJpK{background-color:white}',
      '._1UtDYzbqW0{color:black}',
      '._1UtDYzynoA{color:blue}',
      '._1UtDYzGowl{color:red}',
    ]);
  });

  it('should apply conditional CSS with template literal, nested ternary operators, and different types', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div\`
        background: white;
        \${props => props.isPrimary ? props.isDisabled ? { color: 'black' } : 'color: blue' : \`color: red\`};
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._0KLXruaJpK{background-color:white}',
      '._1UtDYzbqW0{color:black}',
      '._1UtDYzynoA{color:blue}',
      '._1UtDYzGowl{color:red}',
      'className={ax(["_0KLXruaJpK",__cmplp.isPrimary?__cmplp.isDisabled?"_1UtDYzbqW0":"_1UtDYzynoA":"_1UtDYzGowl",__cmplp.className])}',
    ]);
  });

  it('should apply conditional CSS with template literal and multiple props lines', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div\`
        color: red;
        \${props => props.isPrimary && ({ color: 'blue' })};
        \${props => props.isBolded && ({ fontWeight: 'bold' })};
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._1kk5TkmmCn{font-weight:bold}',
      '._1UtDYzynoA{color:blue}',
      '._1UtDYzGowl{color:red}',
      'className={ax(["_1UtDYzGowl",__cmplp.isPrimary&&"_1UtDYzynoA",__cmplp.isBolded&&"_1kk5TkmmCn",__cmplp.className])}',
    ]);
  });

  it('should not allow a logical statement with a conditional right-hand side', () => {
    expect(() =>
      transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div\`
        \${props => props.isShown && (props.isPrimary ? { color: 'blue' } : { color: 'green' })};
      \`;
    `)
    ).toThrow(
      'This ConditionalExpression was unable to have its styles extracted — try to define them statically using Compiled APIs instead'
    );
  });

  it('should apply conditional CSS when using "key: value" in string form', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div\`
        \${props => props.isPrimary ? 'color: green' : \`color: red\`};
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._1UtDYzJwxv{color:green}',
      '._1UtDYzGowl{color:red}',
      'className={ax(["",__cmplp.isPrimary?"_1UtDYzJwxv":"_1UtDYzGowl",__cmplp.className])}',
    ]);
  });

  it('should apply nested conditional CSS when using "key: value" in string form', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div\`
        \${props => props.isPrimary ? 'color: blue' :  props.isGreen ? 'color: green' : 'color: red'};
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._1UtDYzJwxv{color:green}',
      '._1UtDYzynoA{color:blue}',
      '._1UtDYzGowl{color:red}',
      'className={ax(["",__cmplp.isPrimary?"_1UtDYzynoA":__cmplp.isGreen?"_1UtDYzJwxv":"_1UtDYzGowl",__cmplp.className])}',
    ]);
  });

  it('should apply conditional CSS when using "key: value; key: value; ..." in string form', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div\`
        \${props => props.isPrimary ? 'color: green; font-size: 12px;' : \`color: red; font-size: 16px;\`};
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._1UtDYzJwxv{color:green}',
      '._1UtDYzGowl{color:red}',
      '._4ya3eErjyG{font-size:12px}',
      '._4ya3eE50T1{font-size:16px}',
      'className={ax(["",__cmplp.isPrimary?"_1UtDYzJwxv _4ya3eErjyG":"_1UtDYzGowl _4ya3eE50T1",__cmplp.className])}',
    ]);
  });

  it('should apply conditional CSS when using inline mixins', () => {
    const actual = transform(`
      import { styled, css } from '@compiled/react';

      const Component = styled.div\`
        \${props => props.isPrimary ? css\`color: green\` : css({ color: 'red' })};
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._1UtDYzJwxv{color:green}',
      '._1UtDYzGowl{color:red}',
      'className={ax(["",__cmplp.isPrimary?"_1UtDYzJwxv":"_1UtDYzGowl",__cmplp.className])}',
    ]);
  });

  it('should apply unconditional before and after a conditional css rule with template literal', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div\`
        color: red;
        background: white;
        \${props => props.isPrimary && ({ color: 'blue' })};
        border: 3px solid yellow;
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._1UtDYzynoA{color:blue}',
      '._30huDKoshS{border:3px solid yellow}',
      '._0KLXruaJpK{background-color:white}',
      '._1UtDYzGowl{color:red}',
      '{ax(["_0KLXruaJpK _30huDKoshS _1UtDYzGowl",__cmplp.isPrimary&&"_1UtDYzynoA",__cmplp.className])}',
    ]);
  });

  it('should apply unconditional after a conditional css rule with template literal', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div\`
        \${props => props.isPrimary && ({ color: 'blue' })};
        border: 3px solid yellow;
        color: red;
        background: white;
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._1UtDYzynoA{color:blue}',
      '._0KLXruaJpK{background-color:white}',
      '._1UtDYzGowl{color:red}',
      '._30huDKoshS{border:3px solid yellow}',
      '{ax(["_30huDKoshS _0KLXruaJpK _1UtDYzGowl",__cmplp.isPrimary&&"_1UtDYzynoA",__cmplp.className])}',
    ]);
  });

  it('should apply unconditional CSS with props', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div(
        props => ({ color: props.primary }),
      );
    `);

    expect(actual).toIncludeMultiple([
      'const _="._1UtDYz36Yi{color:var(--_1r7cl4y)}"',
      '"--_1r7cl4y":ix(__cmplp.primary)',
      'className={ax(["_1UtDYz36Yi",__cmplp.className])}',
    ]);
  });

  it('should apply unconditional CSS with and without props', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div(
        { background: 'red' },
        props => ({ color: props.primary }),
      );
    `);

    expect(actual).toIncludeMultiple([
      '._1UtDYz36Yi{color:var(--_1r7cl4y)}',
      '._0KLXruGowl{background-color:red}',
      '--_1r7cl4y":ix(__cmplp.primary)}',
      'className={ax(["_0KLXruGowl _1UtDYz36Yi",__cmplp.className])}',
    ]);
  });

  it('should apply conditional CSS with object styles', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div(
        { color: 'red' },
        props => props.isPrimary && ({ color: 'blue' }),
      );
    `);

    expect(actual).toIncludeMultiple([
      '._1UtDYzynoA{color:blue}',
      '._1UtDYzGowl{color:red}',
      'className={ax(["_1UtDYzGowl",__cmplp.isPrimary&&"_1UtDYzynoA",__cmplp.className])}',
    ]);
  });

  it('should apply conditional CSS with object styles and multiple props lines', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div(
        { color: 'red' },
        props => props.isPrimary && ({ color: 'blue' }),
        props => props.isBolded && ({ fontWeight: 'bold' }),
      );
    `);

    expect(actual).toIncludeMultiple([
      '._1kk5TkmmCn{font-weight:bold}',
      '._1UtDYzynoA{color:blue}',
      '._1UtDYzGowl{color:red}',
      'className={ax(["_1UtDYzGowl",__cmplp.isPrimary&&"_1UtDYzynoA",__cmplp.isBolded&&"_1kk5TkmmCn",__cmplp.className])}',
    ]);
  });

  it('should apply unconditional before and after a conditional css rule with object styles', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div(
        { color: 'red' },
        props => props.isPrimary && ({ color: 'blue' }),
        { border: '1px solid black'},
      );
    `);

    expect(actual).toIncludeMultiple([
      '._1UtDYzynoA{color:blue}',
      '._30huDK2Tva{border:1px solid black}',
      '._1UtDYzGowl{color:red}',
      '{ax(["_30huDK2Tva _1UtDYzGowl",__cmplp.isPrimary&&"_1UtDYzynoA",__cmplp.className])}',
    ]);
  });

  it('should apply conditional CSS with object styles regardless declaration order', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div(
        props => props.isPrimary && ({ color: 'red' }),
        { color: 'blue' },
      );
    `);

    expect(actual).toIncludeMultiple([
      '._1UtDYzGowl{color:red}',
      '._1UtDYzynoA{color:blue}',

      'className={ax(["_1UtDYzynoA",__cmplp.isPrimary&&"_1UtDYzGowl",__cmplp.className])}',
    ]);
  });

  it('should apply multi conditional logical expression', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div(
        { color: 'red' },
        props => (props.isPrimary || props.isMaybe) && ({ color: 'blue' }),
      );
    `);

    expect(actual).toIncludeMultiple([
      '._1UtDYzynoA{color:blue}',
      '._1UtDYzGowl{color:red}',
      '{ax(["_1UtDYzGowl",(__cmplp.isPrimary||__cmplp.isMaybe)&&"_1UtDYzynoA",__cmplp.className])}',
    ]);
  });

  it('should apply multi conditional logical expression with different props lines and syntax styles', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div(
        { color: 'red' },
        (props) => props.isPrimary && { color: 'blue' },
        { fontWeight: (props) => (props.isBolded ? 'bold' : 'normal')}
      );
    `);

    expect(actual).toIncludeMultiple([
      '._1kk5TkmmCn{font-weight:bold}',
      '._1kk5TkzUZr{font-weight:normal}',
      '._1UtDYzynoA{color:blue}',
      '._1UtDYzGowl{color:red}',
      '{ax(["_1UtDYzGowl",__cmplp.isPrimary&&"_1UtDYzynoA",__cmplp.isBolded?"_1kk5TkmmCn":"_1kk5TkzUZr",__cmplp.className])}/>',
    ]);
  });

  it('should apply the same CSS property with unconditional as default and multiple logical expressions', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div(
        { color: 'red' },
        props => props.isPrimary && (props.isBolded || props.isFoo) && ({ color: 'blue' }),
      );
    `);

    expect(actual).toIncludeMultiple([
      '._1UtDYzynoA{color:blue}',
      '._1UtDYzGowl{color:red}',
      '{ax(["_1UtDYzGowl",__cmplp.isPrimary&&(__cmplp.isBolded||__cmplp.isFoo)&&"_1UtDYzynoA",__cmplp.className])}',
    ]);
  });

  it('should apply conditional CSS with ternary and boolean in the same line', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div(
        { fontSize: '20px' },
        props => props.isPrimary && props.isBolded ? ({ color: 'blue' }) : ({ color: 'red'}),
      );
    `);

    expect(actual).toIncludeMultiple([
      '._1UtDYzynoA{color:blue}',
      '._1UtDYzGowl{color:red}',
      '._4ya3eESPN1{font-size:20px}',
      'className={ax(["_4ya3eESPN1",__cmplp.isPrimary&&__cmplp.isBolded?"_1UtDYzynoA":"_1UtDYzGowl",__cmplp.className])}/',
    ]);
  });

  it('should only evaluate the last unconditional CSS rule for each property', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div(
        { color: 'red' },
        { color: 'white', background: 'black' },
        { color: 'orange'},
        { background: 'white'},
      );
    `);

    expect(actual).toIncludeMultiple([
      '._0KLXruaJpK{background-color:white}',
      '._1UtDYz0axx{color:orange}',
      'className={ax(["_0KLXruaJpK _1UtDYz0axx",__cmplp.className])}',
    ]);
  });

  it('should only add falsy condition when truthy condition has no value', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div(
        props => props.isPrimary ? undefined : { color: 'green', background: 'black' },
      );
    `);

    expect(actual).toIncludeMultiple([
      '._1UtDYzJwxv{color:green}',
      '._0KLXrubqW0{background-color:black}',
      'className={ax(["",!__cmplp.isPrimary&&"_0KLXrubqW0 _1UtDYzJwxv",__cmplp.className])}',
    ]);
  });

  it('should only add truthy condition when falsy condition has no value', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div(
        props => props.isPrimary ? { color: 'green', background: 'black' } : undefined,
      );
    `);

    expect(actual).toIncludeMultiple([
      '._1UtDYzJwxv{color:green}',
      '._0KLXrubqW0{background-color:black}',
      'className={ax(["",__cmplp.isPrimary&&"_0KLXrubqW0 _1UtDYzJwxv",__cmplp.className])}',
    ]);
  });

  it('should apply logical test to class when a conditional branch contains undefined value', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div\`
        color: \${props => props.isPrimary ? 'green' : undefined};
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._1UtDYzJwxv{color:green}',
      'className={ax(["",__cmplp.isPrimary&&"_1UtDYzJwxv",__cmplp.className])}',
    ]);
  });

  it('should apply logical test to class when a conditional branch contains null value', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div({
        color: props => props.isPrimary ? null : 'green',
      });
    `);

    expect(actual).toIncludeMultiple([
      '._1UtDYzJwxv{color:green}',
      'className={ax(["",!__cmplp.isPrimary&&"_1UtDYzJwxv",__cmplp.className])}',
    ]);
  });

  it('should apply logical test to class when a conditional branch contains empty string value', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div({
        color: props => props.isPrimary ? '' : 'green',
      });
    `);

    expect(actual).toIncludeMultiple([
      '._1UtDYzJwxv{color:green}',
      'className={ax(["",!__cmplp.isPrimary&&"_1UtDYzJwxv",__cmplp.className])}',
    ]);
  });

  it('should apply logical test to class when a conditional branch contains empty value inside selector', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div({
        ':hover': {
          color: props => props.isPrimary ? 'green' : '',
        }
      });
    `);

    expect(actual).toIncludeMultiple([
      '._0clgaMJwxv:hover{color:green}',
      'className={ax(["",__cmplp.isPrimary&&"_0clgaMJwxv",__cmplp.className])}',
    ]);
  });

  it('should apply logical test to class when a conditional branch contains empty value inside selector', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div({
        ':hover': {
          color: props => props.isPrimary ? 'green' : '',
        }
      });
    `);

    expect(actual).toIncludeMultiple([
      '._0clgaMJwxv:hover{color:green}',
      'className={ax(["",__cmplp.isPrimary&&"_0clgaMJwxv",__cmplp.className])}',
    ]);
  });

  it('should apply no classes when both conditional branches contains empty values', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div({
        color: props => props.isPrimary ? undefined : null,
      });
    `);

    expect(actual).toInclude('className={ax(["",__cmplp.className])}');
  });

  it('should conditionally apply CSS mixins', () => {
    const actual = transform(`
      import { styled, css } from '@compiled/react';

      const dark = css\`
        background-color: black;
        color: white;
      \`;

      const light = css({
        'background-color': 'white',
        color: 'black',
      });

      const Component = styled.div\`
        \${(props) => (props.isDark ? dark : light)};
        font-size: 30px;
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._1UtDYzbqW0{color:black}',
      '._0KLXruaJpK{background-color:white}',
      '._1UtDYzaJpK{color:white}',
      '_0KLXrubqW0{background-color:black}',
      '_4ya3eEuNcX{font-size:30px}',
      'className={ax(["_4ya3eEuNcX",__cmplp.isDark?"_0KLXrubqW0 _1UtDYzaJpK":"_0KLXruaJpK _1UtDYzbqW0",__cmplp.className])}',
    ]);
  });

  it('falls back to using CSS variable when conditional is not sole expression in statement', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';
      const gutter = 10;

      const Component = styled.div\`
        width: calc(\${gutter}px + \${({ isLarge }) => isLarge ? 100 : 50}px);
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._39xV02WUwJ{width:calc(10px + var(--_1e9pbah))}',
      '"--_1e9pbah":ix(__cmplp.isLarge?100:50,"px")',
      '{ax(["_39xV02WUwJ",__cmplp.className])}',
    ]);
  });

  it('falls back to using CSS variable when conditional followed by another expression in statement', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';
      const gutter = 10;

      const Component = styled.div\`
        width: calc(\${({ isLarge }) => isLarge ? 100 : 50}px - \${gutter}px);
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._39xV02Tu3f{width:calc(var(--_1e9pbah) - 10px)}',
      '"--_1e9pbah":ix(__cmplp.isLarge?100:50,"px")',
      '{ax(["_39xV02Tu3f",__cmplp.className])}',
    ]);
  });

  it('falls back to using CSS variable when conditional is inside quotes', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div\`
        :before {
          content: '\${({ isOpen }) => isOpen ? 'show less' : 'show more'}';
        }
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._3Ku51IKCJE:before{content:var(--_8txsa8)}',
      '"--_8txsa8":ix(__cmplp.isOpen?\'show less\':\'show more\',"\'","\'")',
      '{ax(["_3Ku51IKCJE",__cmplp.className])}',
    ]);
  });

  it('should apply conditional CSS to related selector', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div\`
        background: url('data:image/svg+xml; ... ');
        color: \${({ isSelected }) => isSelected ? 'blue' : 'yellow'};

        :hover {
          border: \${({ isHover }) => isHover ? '1px solid white' : '2px solid black'};
        }
      \`;
    `);

    expect(actual).toIncludeMultiple([
      "._2uo31fTS0E{background:url('data:image/svg+xml; ... ')}",
      '._1UtDYzynoA{color:blue}',
      '._1UtDYzFQV5{color:yellow}',
      '._0KOPe2bJcw:hover{border:1px solid white}',
      '_0KOPe2pjH2:hover{border:2px solid black}',
      '{ax(["_2uo31fTS0E",__cmplp.isSelected?"_1UtDYzynoA":"_1UtDYzFQV5",__cmplp.isHover?"_0KOPe2bJcw":"_0KOPe2pjH2",__cmplp.className])}',
    ]);
  });

  it('should apply conditional CSS to related selector with object styles', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div({
        color: ({ isSelected }) => isSelected ? 'blue' : 'yellow',
        ':hover': {
          border: ({ isHover }) => isHover ? '1px solid white' : '2px solid black',
        }
      });
    `);

    expect(actual).toIncludeMultiple([
      '._1UtDYzynoA{color:blue}',
      '._1UtDYzFQV5{color:yellow}',
      '._0KOPe2bJcw:hover{border:1px solid white}',
      '_0KOPe2pjH2:hover{border:2px solid black}',
      '{ax(["",__cmplp.isSelected?"_1UtDYzynoA":"_1UtDYzFQV5",__cmplp.isHover?"_0KOPe2bJcw":"_0KOPe2pjH2",__cmplp.className])}',
    ]);
  });

  it('should apply conditional CSS to related nested selector', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div\`
        color: \${({ isSelected }) => isSelected ? 'blue' : 'yellow'};

        :hover {
          border: \${({ isHover }) => isHover ? '1px solid white' : '2px solid black'};
          background-color: cyan;

          :before {
            content: "Don't break closure parsing }";
            display:  \${({ isBefore }) => isBefore ? 'inherit' : 'inline'};
          }
        }
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._1UtDYzynoA{color:blue}',
      '._1UtDYzFQV5{color:yellow}',
      '._0KOPe2bJcw:hover{border:1px solid white}',
      '_0KOPe2pjH2:hover{border:2px solid black}',
      '._1eOmH67Qsp:hover{background-color:cyan}',
      '._26w8i9v5RY:hover:before{content:\\"Don\'t break closure parsing }\\"}',
      '._3FyRtpOLYo:hover:before{display:inherit}',
      '._3FyRtpS8kF:hover:before{display:inline}',
      '{ax(["_1eOmH67Qsp _26w8i9v5RY",__cmplp.isSelected?"_1UtDYzynoA":"_1UtDYzFQV5",__cmplp.isHover?"_0KOPe2bJcw":"_0KOPe2pjH2",__cmplp.isBefore?"_3FyRtpOLYo":"_3FyRtpS8kF",__cmplp.className])}',
    ]);
  });

  it('does not conflict conditional CSS with above selectors', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div\`
        > span:first-type-of {
          color: red;
        }

        :hover {
          background-color: cyan;
        }

        :focus {
          border-radius: \${({ isFocus }) => isFocus ? 3 : 2}px;
        }
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._3Ze5iJGowl >span:first-type-of{color:red}',
      '._1eOmH67Qsp:hover{background-color:cyan}',
      '._25uIpA4Y4b:focus{border-radius:3px}',
      '._25uIpA4Jdh:focus{border-radius:2px}',
      '{ax(["_3Ze5iJGowl _1eOmH67Qsp",__cmplp.isFocus?"_25uIpA4Y4b":"_25uIpA4Jdh",__cmplp.className])}',
    ]);
  });

  it('does not conflict conditional CSS with below selectors', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div\`
        :focus {
          border-radius: \${({ isFocus }) => isFocus ? 3 : 2}px;
        }

        > span:first-type-of {
          color: red;
        }

        :hover {
          background-color: cyan;
        }
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._3Ze5iJGowl >span:first-type-of{color:red}',
      '._1eOmH67Qsp:hover{background-color:cyan}',
      '._25uIpA4Y4b:focus{border-radius:3px}',
      '._25uIpA4Jdh:focus{border-radius:2px}',
      '{ax(["_3Ze5iJGowl _1eOmH67Qsp",__cmplp.isFocus?"_25uIpA4Y4b":"_25uIpA4Jdh",__cmplp.className])}',
    ]);
  });

  it('does not conflict conditional CSS with surrounding selectors', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const Component = styled.div\`
        > span:first-type-of {
          color: red;
        }

        :focus {
          border-radius: \${({ isFocus }) => isFocus ? 3 : 2}px;
        }

        :hover {
          background-color: cyan;
        }
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._3Ze5iJGowl >span:first-type-of{color:red}',
      '._1eOmH67Qsp:hover{background-color:cyan}',
      '._25uIpA4Y4b:focus{border-radius:3px}',
      '._25uIpA4Jdh:focus{border-radius:2px}',
      '{ax(["_3Ze5iJGowl _1eOmH67Qsp",__cmplp.isFocus?"_25uIpA4Y4b":"_25uIpA4Jdh",__cmplp.className])}',
    ]);
  });
});
