import { transformSync } from '@babel/core';
import babelPlugin from '../../index';

jest.mock('@compiled/utils', () => {
  return { ...jest.requireActual('@compiled/utils'), hash: () => 'hash-test' };
});

const transform = (code: string) => {
  return transformSync(code, {
    configFile: false,
    babelrc: false,
    compact: true,
    plugins: [babelPlugin],
  })?.code;
};

describe('css prop', () => {
  it('should transform a self closing element', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';

      <div css={{}} />
    `);

    expect(actual).toInclude('<div className="cc-hash-test"/>');
  });

  it('should replace css prop with class name', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';

      <div css={{}}>hello world</div>
    `);

    expect(actual).toInclude('<div className="cc-hash-test">hello world</div>');
  });

  it('should retain default import', () => {
    const actual = transform(`
      import defaultImport from '@compiled/core';
      import React from 'react';

      <div css={{}} />
    `);

    expect(actual).toInclude('defaultImport');
  });

  it('should pass through style identifier when there is no dynamic styles in the css', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';

      const Component = ({ className, style }) => <div className={className} style={style} css={{ fontSize: 12 }}>hello world</div>;
    `);

    expect(actual).toInclude('style={style}');
  });

  it('should pass through style property access when there is no dynamic styles in the css', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';

      const Component = ({ className, ...props }) => <div className={className} style={props.style} css={{ fontSize: 12 }}>hello world</div>;
    `);

    expect(actual).toInclude('style={props.style}');
  });

  it('should spread style identifier when there is dynamic styles in the css', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';
      const [fontSize] = React.useState('10px');
      const red = 'red';

      const Component = ({ className, style }) => <div className={className} style={style} css={{ fontSize, color: red }}>hello world</div>;
    `);

    expect(actual).toInclude('style={{...style,"--var-hash-test":fontSize}}');
  });

  it('should spread style property access when there is dynamic styles in the css', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';
      const [background] = React.useState("violet");
      const red = 'red';
      const Component = ({ className, ...props }) => <div className={className} style={props.style} css={{ fontSize: 12, color: red, background }}>hello world</div>;
    `);

    expect(actual).toInclude('style={{...props.style,"--var-hash-test":background}}');
  });

  it('should spread style identifier when there is styles already set', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';

      const Component = ({ className, style }) => <div className={className} style={{ ...style, display: 'block' }} css={{ fontSize: 12 }}>hello world</div>;
    `);

    expect(actual).toInclude(`style={{...style,display:'block'}}`);
  });

  it('should spread style identifier when there is styles already set and using dynamic css', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';

      const [background] = React.useState('yellow');
      const red = 'red';
      const Component = ({ className, style }) => <div className={className} style={{ ...style, display: 'block' }} css={{ fontSize: 12, color: red, background }}>hello world</div>;
    `);

    expect(actual).toInclude(`style={{...style,display:'block',\"--var-hash-test\":background}}`);
    expect(actual).toInclude(
      `.cc-hash-test{font-size:12px;color:red;background:var(--var-hash-test)}`
    );
  });

  it('should evaluate simple expressions', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';

      <div css={{ fontSize: 8 * 2 }}>hello world</div>
    `);

    expect(actual).toInclude('.cc-hash-test{font-size:16px}');
  });

  it('should bail out evaluating expression referencing a mutable identifier', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';

      let mutable = 2;
      mutable = 1;

      <div css={{ fontSize: mutable }}>hello world</div>
    `);

    expect(actual).toInclude('.cc-hash-test{font-size:var(--var-hash-test)}');
  });

  it('should bail out evaluating identifier expression referencing a mutated identifier', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';

      let mutable = 2;
      const dontchange = mutable;
      mutable = 3;

      <div css={{ fontSize: dontchange }}>hello world</div>
    `);

    expect(actual).toInclude('.cc-hash-test{font-size:var(--var-hash-test)}');
  });

  it('should bail out evaluating expression that references a constant expression referencing a mutated expression', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';

      let mutable = false;
      const dontchange = mutable ? 1 : 2;
      mutable = true;

      <div css={{ fontSize: dontchange }}>hello world</div>
    `);

    expect(actual).toInclude('.cc-hash-test{font-size:var(--var-hash-test)}');
  });

  it('should bail out evaluating a binary expression referencing a mutated identifier', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';

      let mutable = 2;
      mutable = 3;

      <div css={{ fontSize: mutable * 2 }}>hello world</div>
    `);

    expect(actual).toInclude('.cc-hash-test{font-size:var(--var-hash-test)}');
  });

  it('should concat explicit use of class name prop on an element', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';

      <div className="foobar" css={{}}>hello world</div>
    `);

    expect(actual).toInclude('className={"cc-hash-test"+(" "+"foobar")}');
  });

  it('should pass through spread props', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';

      const props = {};

      <div
        css={{
          fontSize: 20,
        }}
        {...props}
      />
    `);

    expect(actual).toInclude('<div{...props}className="cc-hash-test"/>');
  });

  it('should pass through static props', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';

      <div
        css={{
          fontSize: 20,
        }}
        role="menu"
      />
    `);

    expect(actual).toInclude('<div role="menu"className="cc-hash-test"/>');
  });

  it('should concat explicit use of class name prop from an identifier on an element', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';

      const className = "foobar";
      <div className={className} css={{}}>hello world</div>
    `);

    expect(actual).toInclude('className={"cc-hash-test"+(className?" "+className:"")}');
  });

  it('should pick up array composition', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';

      const base = { color: 'black' };
      const top = \` color: red; \`;

      <div css={[base, top]}>hello world</div>
    `);

    expect(actual).toInclude('.cc-hash-test{color:black;color:red}');
  });

  it('should persist static style prop', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';

      <div style={{ display: 'block' }} css={{ color: 'blue' }}>hello world</div>
    `);

    expect(actual).toInclude(`.cc-hash-test{color:blue}`);
    expect(actual).toInclude(
      `<div style={{display:'block'}}className=\"cc-hash-test\">hello world</div>`
    );
  });

  it('should inline mutable identifier that is not mutated', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';

      let notMutatedAgain = 20;

      <div css={{ fontSize: notMutatedAgain }}>hello world</div>
    `);

    expect(actual).toInclude('.cc-hash-test{font-size:20px}');
  });

  it('should concat explicit use of style prop on an element when destructured template', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';

      const [color] = ['blue'];
      <div style={{ display: 'block' }} css={{ color: \`\${color}\` }}>hello world</div>
    `);

    expect(actual).toInclude(`.cc-hash-test{color:var(--var-hash-test)}`);
    expect(actual).toInclude(`style={{display:'block',\"--var-hash-test\":color}}`);
  });

  it('should concat implicit use of class name prop where class name is a jsx expression', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';

      const getFoo = () => 'foobar';

      <div css={{}} className={getFoo()}>hello world</div>
    `);

    expect(actual).toInclude('className={"cc-hash-test"+(getFoo()?" "+getFoo():"")}');
  });

  it('should allow inlined expressions as property values', () => {
    const actual = transform(`
      import '@compiled/core';

      let hello = true;
      hello = false;

      <div css={{ color: hello ? 'red' : 'blue', fontSize: 10 }}>hello world</div>
    `);

    expect(actual).toInclude('.cc-hash-test{color:var(--var-hash-test);font-size:10px}');
    expect(actual).toInclude(`style={{\"--var-hash-test\":hello?'red':'blue'}}`);
  });

  it('should inline multi interpolation constant variable', () => {
    // See: https://codesandbox.io/s/dank-star-443ps?file=/src/index.js
    const actual = transform(`
      import '@compiled/core';

      const N30 = 'gray';

      <div css={{
        backgroundImage: \`linear-gradient(45deg, \${N30} 25%, transparent 25%),
        linear-gradient(-45deg, \${N30} 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, \${N30} 75%),
        linear-gradient(-45deg, transparent 75%, \${N30} 75%)\`
      }}>hello world</div>
    `);

    expect(actual).toInclude(
      `.cc-hash-test{background-image:linear-gradient(45deg,gray 25%,transparent 25%),linear-gradient(-45deg,gray 25%,transparent 25%),linear-gradient(45deg,transparent 75%,gray 75%),linear-gradient(-45deg,transparent 75%,gray 75%)}`
    );
  });

  it('should move dynamic multi interpolation variable into css variable', () => {
    // See: https://codesandbox.io/s/dank-star-443ps?file=/src/index.js
    const actual = transform(`
      import '@compiled/core';
      import {useState} from 'react';

      let N30 = 'gray';
      N30 = 'blue';

      <div css={{
        backgroundImage: \`linear-gradient(45deg, \${N30} 25%, transparent 25%),
        linear-gradient(-45deg, \${N30} 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, \${N30} 75%),
        linear-gradient(-45deg, transparent 75%, \${N30} 75%)\`
      }}>hello world</div>
    `);

    expect(actual).toInclude(
      `.cc-hash-test{background-image:linear-gradient(45deg,var(--var-hash-test) 25%,transparent 25%),linear-gradient(-45deg,var(--var-hash-test) 25%,transparent 25%),linear-gradient(45deg,transparent 75%,var(--var-hash-test) 75%),linear-gradient(-45deg,transparent 75%,var(--var-hash-test) 75%)}`
    );
    expect(actual).toInclude('style={{"--var-hash-test":N30}}');
  });

  it('should allow expressions stored in a variable as shorthand property values', () => {
    const actual = transform(`
      import '@compiled/core';

      let hello = true;
      hello = false;
      let color = hello ? 'red' : 'blue' ;

      <div css={{ color }}>hello world</div>
    `);

    expect(actual).toInclude('.cc-hash-test{color:var(--var-hash-test)}');
    expect(actual).toInclude(`style={{\"--var-hash-test\":color}}`);
  });

  it('should allow expressions stored in a variable as property values', () => {
    const actual = transform(`
      import '@compiled/core';

      let hello = true;
      hello = false;
      let colorsz = hello ? 'red' : 'blue' ;

      <div css={{ color: colorsz }}>hello world</div>
    `);

    expect(actual).toInclude('.cc-hash-test{color:var(--var-hash-test)}');
    expect(actual).toInclude(`style={{\"--var-hash-test\":colorsz}}`);
  });

  it('should remove css prop', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';

      const color = 'blue';

      <div css={{ color: color }} style={{ display: "block" }}>hello world</div>
    `);

    expect(actual).not.toInclude('css={');
  });

  it('should keep other props around', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';

      const color = 'blue';

      <div data-testid="yo" css={{ color: color }} style={{ display: "block" }}>hello world</div>
    `);

    expect(actual).toInclude('data-testid="yo"');
  });

  it('should add an identifier nonce to the style element', () => {
    const actual = transformSync(
      `
    import '@compiled/core';
    import React from 'react';

    const color = 'blue';

    <div data-testid="yo" css={{ color: color }} style={{ display: "block" }}>hello world</div>
  `,
      {
        configFile: false,
        babelrc: false,
        compact: true,
        plugins: [[babelPlugin, { nonce: '__webpack_nonce__' }]],
      }
    )?.code;

    expect(actual).toInclude('<CS nonce={__webpack_nonce__}hash="hash-test">');
  });

  it('should bubble up top level pseudo inside a media atrule', () => {
    const actual = transform(`
    import '@compiled/core';
    import React from 'react';

    const fontSize = 20;

    <div css={\`
      @media screen {
        :hover {
          color: red;
        }
      }
    \`}>hello world</div>
  `);

    expect(actual).toInclude('.cc-hash-test:hover{color:red}');
  });

  it('should bubble up top level pseduo inside a support atrule', () => {
    const actual = transform(`
    import '@compiled/core';
    import React from 'react';

    const fontSize = 20;

    <div css={\`
      @supports (display: grid) {
        :hover {
          color: red;
        }
      }
    \`}>hello world</div>
  `);

    expect(actual).toInclude('.cc-hash-test:hover{color:red}');
  });

  describe('using strings', () => {
    it('should persist suffix of dynamic value into inline styles', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        let fontSize = 20;
        fontSize = 19;

        <div css={\`font-size: \${fontSize}px;color:red;\`}>hello world</div>
      `);

      expect(actual).toInclude('.cc-hash-test{font-size:var(--var-hash-test);color:red}');
      expect(actual).toInclude('style={{"--var-hash-test":(fontSize||"")+"px"}}');
    });

    it('should persist suffix of constant value', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const fontSize = 20;

        <div css={\`font-size: \${fontSize}px;\`}>hello world</div>
      `);

      expect(actual).toInclude('.cc-hash-test{font-size:20px}');
    });

    it('should transform string literal', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        <div css="font-size: 20px;">hello world</div>
    `);

      expect(actual).toInclude('.cc-hash-test{font-size:20px}');
    });

    it('should inline constant object property value', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const colors = { error: 'red' };

        <div
          css={\`
          color: \${colors.error};
        \`}>
          hello world
        </div>
      `);

      expect(actual).toInclude('.cc-hash-test{color:red}');
    });

    it('should evaluate deep member expression referencing an identifier', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const primaryColor = 'blue';

        const theme = {
          colors: {
            light: {
              primary: primaryColor,
            },
            dark: {
              primary: 'black',
            },
          }
        };

        <div
          css={\`
          color: \${theme.colors.light.primary};
        \`}>
          hello world
        </div>
      `);

      expect(actual).toInclude('.cc-hash-test{color:blue}');
    });

    it('should inline nested constant object property value', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const theme = {
          colors: {
            light: {
              primary: '#fff',
            },
            dark: {
              primary: 'black',
            },
          }
        };

        <div
          css={\`
          color: \${theme.colors.light.primary};
        \`}>
          hello world
        </div>
      `);

      expect(actual).toInclude('.cc-hash-test{color:#fff}');
    });

    it('should transform binary expression', () => {
      const actual = transform(`
        import '@compiled/core';

        export const EmphasisText = (props) => (
          <span
            css={\`
              color: $\{props.color};
              text-transform: uppercase;
              font-weight: 600;
            \`}>{props.children}</span>
        );
      `);

      expect(actual).toInclude(
        '.cc-hash-test{color:var(--var-hash-test);text-transform:uppercase;font-weight:600}'
      );
      expect(actual).toInclude('style={{"--var-hash-test":props.color}}');
    });

    it('should transform no template string literal', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        <div css={\`font-size: 20px;\`}>hello world</div>
    `);

      expect(actual).toInclude('.cc-hash-test{font-size:20px}');
    });

    it('should inline constant expression', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const color = 'blue';
        <div css={\`color: \${color};\`}>hello world</div>
      `);

      expect(actual).toInclude('.cc-hash-test{color:blue}');
    });

    it('should transform an expression', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        let sidenav = true;
        sidenav = false;

        <div
          css={\`
            display: grid;
            grid-template-areas: $\{
              sidenav ? "'header header' 'sidebar content'" : "'header header' 'content content'"
            };
          \`}
        >
          hello world
        </div>
      `);

      expect(actual).toInclude(
        '.cc-hash-test{display:grid;grid-template-areas:var(--var-hash-test)}'
      );
      expect(actual).toInclude(
        `\"--var-hash-test\":sidenav?\"'header header' 'sidebar content'\":\"'header header' 'content content'\"`
      );
    });

    it('should transform template string literal with obj variable', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const style = { color: 'blue', fontSize: '30px' };
        <div css={\`\${style};color: red;\`}>hello world</div>
      `);

      expect(actual).toInclude('.cc-hash-test{color:blue;font-size:30px;color:red}');
    });

    xit('should transform template string with no argument arrow function variable', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const mixin = () => ({ color: 'blue', fontSize: '30px' });
        <div css={\`\${mixin}\`}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{color:blue;font-size:30px}');
    });

    xit('should transform template string with no argument arrow function call variable', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const mixin = () => ({ color: 'blue', fontSize: '30px' });
        <div css={\`\${mixin()}\`}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{color:blue;font-size:30px}');
    });

    xit('should transform template string with no argument function variable', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        function mixin() {
          return { color: 'red' };
        }

        <div css={\`\${mixin()}\`}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{color:red}');
    });

    xit('should transform template string with argument arrow function variable', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const mixin = (color: string) => ({ color, fontSize: '30px' });
        const primary = 'red';

        <div css={\`\${mixin(primary)}\`}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{color:var(--var-test);font-size:30px}');
      expect(actual).toInclude('style={{ "--var-test": primary }}');
    });

    it('should inline multiple constant interpolations', () => {
      const actual = transform(`
        import React from 'react';
        import '@compiled/core';

        const x = 1;
        const y = '2px';

        <div
          css={\`
            transform: translate3d(\${x}px, $\{y}, 0);
            color: red;
          \`}
        >
          hello world
        </div>
      `);
      expect(actual).toInclude('.cc-hash-test{transform:translate3d(1px,2px,0);color:red');
    });

    it('should reference multiple interpolations in a group', () => {
      const actual = transform(`
        import React from 'react';
        import '@compiled/core';

        let x = 1;
        x = 1;
        let y = '2px';
        y = '2px';

        <div
          css={\`
            transform: translate3d(\${x}px, $\{y}, 0);
            color: red;
          \`}
        >
          hello world
        </div>
      `);

      // TODO: Correct the hash mock so variables have a unique name instead of hash-test.
      // expect(actual).toInclude('style={{"--var-hash-test":(x||"")+"px","--var-hash-test":y}}');
      expect(actual).toInclude('style={{"--var-hash-test":(x||"")+"px"}}');
      expect(actual).toInclude(
        '.cc-hash-test{transform:translate3d(var(--var-hash-test),var(--var-hash-test),0);color:red}'
      );
    });
  });

  describe('using an object literal', () => {
    it('should inline the variable when it is a constant in string css', () => {
      const actual = transform(`
        import '@compiled/core';

        const bg = 'blue';
        let cl = 'red';
        cl = 'red';

        <div css={{ background: bg, color: cl, textDecoration: 'none', }}>hello world</div>
      `);

      expect(actual).toInclude(
        '.cc-hash-test{background:blue;color:var(--var-hash-test);text-decoration:none'
      );
      expect(actual).toInclude('style={{"--var-hash-test":cl}}');
    });

    it('should inline constant variable', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const fontSize = 20;

        <div css={{ fontSize: \`\${fontSize}px\` }}>hello world</div>
      `);

      expect(actual).toInclude('.cc-hash-test{font-size:20px}');
    });

    it('should inline constant object property value', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const colors = { error: 'red' };

        <div css={{ color: colors.error }}>hello world</div>
      `);

      expect(actual).toInclude('.cc-hash-test{color:red}');
    });

    it('should inline nested constant object property value', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const theme = {
          colors: {
            light: {
              primary: '#fff',
            }
          }
        };

        <div css={{ color: theme.colors.light.primary }}>hello world</div>
      `);

      expect(actual).toInclude('.cc-hash-test{color:#fff}');
    });

    it('should not exhaust the stack when an identifier references itself', () => {
      expect(() => {
        transform(`
        import '@compiled/core';
        import React from 'react';

        let heading = heading || 20;

        <div css={{ marginLeft: \`\${heading.depth}rem\`, color: 'red' }}>hello world</div>
      `);
      }).not.toThrow();
    });

    it('should persist suffix of dynamic property value from objects into inline styles', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        let heading = {
          depth: 20
        };
        heading = {};

        <div css={{ marginLeft: \`\${heading.depth}rem\`, color: 'red' }}>hello world</div>
      `);

      expect(actual).toInclude('.cc-hash-test{margin-left:var(--var-hash-test);color:red}');
      expect(actual).toInclude('style={{"--var-hash-test":(heading.depth||"")+"rem"}}');
    });

    it('should persist prefix of dynamic property value into inline styles', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        let fontSize = 20;
        fontSize = 20;

        <div css={{ fontSize: \`calc(100% - \${fontSize}px)\`, color: 'red' }}>hello world</div>
      `);

      expect(actual).toInclude(
        '.cc-hash-test{font-size:calc(100% - var(--var-hash-test));color:red}'
      );
      expect(actual).toInclude('style={{"--var-hash-test":(fontSize||"")+"px"}}');
    });

    it('should move prefix of grouped interpolation into inline styles', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        let heading = header || {
          depth: 20
        };

        <div css={{ marginLeft: \`calc(100% - \${heading.depth}rem)\` }}>hello world</div>
      `);

      expect(actual).toInclude('.cc-hash-test{margin-left:calc(100% - var(--var-hash-test))}');
      expect(actual).toInclude('style={{"--var-hash-test":(heading.depth||"")+"rem"}}');
    });

    it('should move multiple groups of interpolations into inline styles', () => {
      // See: https://codesandbox.io/s/dank-star-443ps?file=/src/index.js
      const actual = transform(`
        import '@compiled/core';

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
        import '@compiled/core';
        import {useState} from 'react';

        let N30 = 'gray';
        N30 = 'gray';

        <div css={\`
          background-image: linear-gradient(45deg, \${N30} 25%, transparent 25%),
            linear-gradient(-45deg, \${N30} 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, \${N30} 75%),
            linear-gradient(-45deg, transparent 75%, \${N30} 75%);
        \`}>hello world</div>
      `);

      expect(actual).toInclude('style={{"--var-hash-test":N30}}');
      expect(actual).toInclude(
        'background-image:linear-gradient(45deg,var(--var-hash-test) 25%,transparent 25%),linear-gradient(-45deg,var(--var-hash-test) 25%,transparent 25%),linear-gradient(45deg,transparent 75%,var(--var-hash-test) 75%),linear-gradient(-45deg,transparent 75%,var(--var-hash-test) 75%)'
      );
    });

    it('should transform object with simple values', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        <div css={{ lineHeight: 20, color: 'blue' }}>hello world</div>
      `);

      expect(actual).toInclude('.cc-hash-test{line-height:20;color:blue}');
    });

    it('should inline constant', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const fontSize = 12;

        <div css={{ fontSize: \`\${fontSize}px\` }}>hello world</div>
      `);

      expect(actual).toInclude('.cc-hash-test{font-size:12px}');
    });

    it('should transform object with nested object into a selector', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        <div css={{ ':hover': { color: 'blue' } }}>hello world</div>
      `);

      expect(actual).toInclude('.cc-hash-test:hover{color:blue}');
    });

    it('should transform object that has a variable reference', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        let blue = 'blue';
        blue = 'blue';

        <div css={{ color: blue }}>hello world</div>
      `);

      expect(actual).toInclude('.cc-hash-test{color:var(--var-hash-test)}');
      expect(actual).toInclude('style={{"--var-hash-test":blue}}');
    });

    it('should transform object that has a destructured variable reference', () => {
      const actual = transform(`
        import '@compiled/core';
        import { useState } from 'react';
        import React from 'react';

        const [color, setColor] = useState('blue');
        <div css={{ color }}>hello world</div>
      `);

      expect(actual).toInclude('style={{"--var-hash-test":color}}');
      expect(actual).toInclude('.cc-hash-test{color:var(--var-hash-test)}');
    });

    it('should transform object spread from variable', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const mixin = { color: 'red' };
        <div css={{ color: 'blue', ...mixin }}>hello world</div>
      `);

      expect(actual).toInclude('.cc-hash-test{color:blue;color:red}');
    });

    it('should transform object with string variable', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const text = 'red';

        <div css={{ color: text }}>hello world</div>
      `);

      expect(actual).toInclude('.cc-hash-test{color:red}');
    });

    it('should transform object with string variable using shorthand notation', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const color = 'red';

        <div css={{ color }}>hello world</div>
      `);

      expect(actual).toInclude('.cc-hash-test{color:red}');
    });

    it('should transform object with obj variable', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

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

      expect(actual).toInclude('.cc-hash-test{display:flex;font-size:50px;color:blue}');
      expect(actual).toInclude('.cc-hash-test:hover{color:red}');
    });

    xit('should transform object with no argument arrow function variable', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const mixin = () => ({ color: 'red' });

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

      expect(actual).toInclude(`.css-test{color:blue;color:red}`);
    });

    it('should transform template literal value', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        <div css={{ color: \`blue\` }}>hello world</div>
      `);

      expect(actual).toInclude(`.cc-hash-test{color:blue}`);
    });

    xit('should transform object spread with no argument arrow function variable', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const mixin = () => ({ color: 'red' });

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{color:blue;color:red}');
    });

    it('should transform inline template literal with suffix', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const gridSize = 4;
        const Div = () => <div css={{
          padding: \`0 \${gridSize}px\`,
          color: 'red',
        }} />;
      `);

      expect(actual).toInclude('.cc-hash-test{padding:0 4px;color:red}');
    });

    xit('should transform object spread with no argument function variable', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        function mixin() {
          return { color: 'red' };
        }

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

      expect(actual).toInclude(`.css-test{color:blue;color:red}`);
    });

    xit('should transform object with no argument arrow function', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const mixin = () => ({ color: 'red' });

        <div css={{ color: 'blue', ':hover': mixin() }}>hello world</div>
      `);

      expect(actual).toInclude(`.css-test{color:blue}`);
      expect(actual).toInclude('.css-test:hover{color:red}');
    });

    it('should extract mixin from identifier', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const base = { color: 'red' };

        <div css={base}>hello world</div>
      `);

      expect(actual).toInclude(`.cc-hash-test{color:red}`);
    });

    it('should transform identifier referencing an template literal', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const base = \`
          color: red;
        \`;

        <div css={base}>hello world</div>
      `);

      expect(actual).toInclude(`.cc-hash-test{color:red}`);
    });

    xit('should transform object with no argument function variable', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        function mixin() {
          return { color: 'red' };
        }

        <div css={{ color: 'blue', ':hover': mixin() }}>hello world</div>
      `);

      expect(actual).toInclude(`.css-test{color:blue}`);
      expect(actual).toInclude('.css-test:hover{color:red}');
    });

    xit('should transform object spread with no argument function variable', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        function mixin() {
          return { color: 'red' };
        }

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{color:blue;color:red}');
    });

    xit('should transform object with argument arrow function variable', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const mixin = (color: string) => ({ color });
        const color = 'red';

        <div css={{ color: 'blue', ...mixin(color) }}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{color:blue;color:red}');
    });

    it('should parse an inline string interpolation delimited by spaces', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const gridSize = () => 8;
        const HORIZONTAL_SPACING = \`\${gridSize() / 2}px\`;

        <div css={{
          padding: \`0 \${HORIZONTAL_SPACING}\`,
          color: 'red',
         }}>hello world</div>
      `);

      expect(actual).toInclude('style={{"--var-hash-test":HORIZONTAL_SPACING}}');
      expect(actual).toInclude('.cc-hash-test{padding:0 var(--var-hash-test);color:red}');
    });

    it('should parse an inline string interpolation delimited by multiple spaces', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const gridSize = () => 8;
        const HORIZONTAL_SPACING = \`\${gridSize() / 2}px\`;

        <div css={{
          padding: \`0 \${HORIZONTAL_SPACING} 0 0\`,
          color: 'red',
         }}>hello world</div>
      `);

      expect(actual).toInclude('.cc-hash-test{padding:0 var(--var-hash-test) 0 0;color:red}');
      expect(actual).toInclude('style={{"--var-hash-test":HORIZONTAL_SPACING}}');
    });

    it('should parse an inline string interpolation delimited by multiple spaces and suffix', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const gridSize = () => 8;
        const HORIZONTAL_SPACING = gridSize();

        <div css={{
          padding: \`0 \${HORIZONTAL_SPACING}px 0 0\`,
          color: 'red',
         }}>hello world</div>
      `);

      expect(actual).toInclude('style={{"--var-hash-test":(HORIZONTAL_SPACING||"")+"px"}}');
      expect(actual).toInclude('.cc-hash-test{padding:0 var(--var-hash-test) 0 0;color:red}');
    });

    it('should parse an inline string interpolation delimited by multiple spaces and multiple suffix', () => {
      const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const gridSize = () => 8;
        const HORIZONTAL_SPACING = gridSize();

        <div css={{
          padding: \`\${HORIZONTAL_SPACING}px \${HORIZONTAL_SPACING}px \${HORIZONTAL_SPACING}px \${HORIZONTAL_SPACING}px\`,
          color: 'red',
         }}>hello world</div>
      `);

      expect(actual).toInclude('style={{"--var-hash-test":(HORIZONTAL_SPACING||"")+"px"}}');
      expect(actual).toInclude(
        '.cc-hash-test{padding:var(--var-hash-test) var(--var-hash-test) var(--var-hash-test) var(--var-hash-test);color:red}'
      );
    });

    it('should do nothing when content already has single quotes', () => {
      const actual = transform(`
        import '@compiled/core';

        const yeah = true;
        <div css={{ content: "'hello'" }}>hello world</div>
      `);

      expect(actual).toInclude(`.cc-hash-test{content:'hello'}`);
    });

    it('should do nothing when content already has double quotes', () => {
      const actual = transform(`
        import '@compiled/core';

        const yeah = true;
        <div css={{ content: '"hello"' }}>hello world</div>
      `);

      expect(actual).toInclude(`.cc-hash-test{content:\\\"hello\\\"}`);
    });

    it('should add quotations to static content if missing', () => {
      const actual = transform(`
        import '@compiled/core';

        const yeah = true;
        <div css={{ content: 'hello' }}>hello world</div>
      `);

      expect(actual).toInclude(`.cc-hash-test{content:\\\"hello\\\"}`);
    });
  });
});
