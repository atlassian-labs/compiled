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

describe('styled component transformer', () => {
  it('should transform with a rebound named import', () => {
    const actual = transform(`
      import { styled as styledFunction, ThemeProvider } from '@compiled/core';

      const ListItem = styledFunction.div({
        fontSize: '20px',
      });
    `);

    expect(actual).toMatchInlineSnapshot(`
      "import*as React from'react';import{ThemeProvider,CC,CS}from'@compiled/core';const ListItem=React.forwardRef(({as:C=\\"div\\",style,...props},ref)=><CC>
            <CS hash=\\"hash-test\\">{[\\".cc-hash-test{font-size:20px}\\"]}</CS>
            <C{...props}style={style}ref={ref}className={\\"cc-hash-test\\"+(props.className?\\" \\"+props.className:\\"\\")}/>
          </CC>);"
    `);
  });

  it('should generate styled object component code', () => {
    const actual = transform(`
      import { styled, ThemeProvider } from '@compiled/core';

      const ListItem = styled.div({
        fontSize: '20px',
      });
    `);

    expect(actual).toMatchInlineSnapshot(`
      "import*as React from'react';import{ThemeProvider,CC,CS}from'@compiled/core';const ListItem=React.forwardRef(({as:C=\\"div\\",style,...props},ref)=><CC>
            <CS hash=\\"hash-test\\">{[\\".cc-hash-test{font-size:20px}\\"]}</CS>
            <C{...props}style={style}ref={ref}className={\\"cc-hash-test\\"+(props.className?\\" \\"+props.className:\\"\\")}/>
          </CC>);"
    `);
  });

  it('should generate styled template literal component code', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';

      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toMatchInlineSnapshot(`
      "import*as React from'react';import{CC,CS}from'@compiled/core';const ListItem=React.forwardRef(({as:C=\\"div\\",style,...props},ref)=><CC>
            <CS hash=\\"hash-test\\">{[\\".cc-hash-test{font-size:20px}\\"]}</CS>
            <C{...props}style={style}ref={ref}className={\\"cc-hash-test\\"+(props.className?\\" \\"+props.className:\\"\\")}/>
          </CC>);"
    `);
  });

  it('should compose CSS from multiple sources', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';

      const styles = { fontSize: 12 };

      const ListItem = styled.div([
        styles,
        \`color: blue;\`,
        { fontWeight: 500 }
      ]);
    `);

    expect(actual).toInclude('.cc-hash-test{font-size:12px;color:blue;font-weight:500}');
  });

  it('should not pass down invalid html attributes to the node', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';
      const ListItem = styled.div({
        fontSize: props => props.textSize,
      });
    `);

    expect(actual).toInclude('textSize,...props');
    expect(actual).toInclude('"--var-hash-test":textSize');
  });

  it('should remove styled import', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';
      const ListItem = styled.div({
        fontSize: '20px',
      });
    `);

    expect(actual).not.toInclude(`import { styled } from '@compiled/core';`);
  });

  it('should replace string literal styled component with component', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';
      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toMatchInlineSnapshot(`
      "import*as React from'react';import{CC,CS}from'@compiled/core';const ListItem=React.forwardRef(({as:C=\\"div\\",style,...props},ref)=><CC>
            <CS hash=\\"hash-test\\">{[\\".cc-hash-test{font-size:20px}\\"]}</CS>
            <C{...props}style={style}ref={ref}className={\\"cc-hash-test\\"+(props.className?\\" \\"+props.className:\\"\\")}/>
          </CC>);"
    `);
  });

  it('should add an identifier nonce to the style element', () => {
    const actual = transformSync(
      `
      import { styled } from '@compiled/core';

      const ListItem = styled.div\`
        font-size: \${props => props.color}px;
      \`;
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

  it('should shortcircuit props with suffix to a empty string to avoid undefined in css', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';

      const ListItem = styled.div\`
        font-size: \${props => props.color}px;
      \`;
    `);

    expect(actual).toInclude('"--var-hash-test":(props.color||"")+"px"');
  });

  it('should add react default import if missing', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';
      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude(`import*as React from'react'`);
  });

  it('should add react default import if it only has named imports', () => {
    const actual = transform(`
      import { useState } from 'react';
      import { styled } from '@compiled/core';
      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude(`import*as React from'react';import{useState}from'react';`);
  });

  it('should spread down props to element', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';

      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude('<C{...props}');
  });

  xit('should set a display name behind a dev flag', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';

      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude('ListItem.displayName = "ListItem";');
  });

  it('should do nothing if react default import is already defined', () => {
    const actual = transform(`
      import React from 'react';
      import { styled } from '@compiled/core';
      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude("import React from'react';");
  });

  xit('should compose a component using template literal', () => {
    const actual = transform(`
      import React from 'react';
      import { styled } from '@compiled/core';

      const Component = () => null;

      const ListItem = styled(Component)\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude('as: C = Component');
  });

  xit('should compose a component using object literal', () => {
    const actual = transform(`
      import React from 'react';
      import { styled } from '@compiled/core';

      const Component = () => null;

      const ListItem = styled(Component)({
        fontSize: 20
      });
    `);

    expect(actual).toInclude('as: C = Component');
  });

  it('should concat class name prop if defined', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';
      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude(
      `className={\"cc-hash-test\"+(props.className?\" \"+props.className:\"\")}`
    );
  });

  describe('using a string literal', () => {
    it('should respect missing units', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';
        const ListItem = styled.div\`
          font-size: 12;
        \`;
      `);

      expect(actual).toInclude('.cc-hash-test{font-size:12}');
    });

    it('should not pass down invalid html attributes to the node when property has a suffix', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';
        const ListItem = styled.div\`
          font-size: \${props => props.textSize}px;
        \`;
      `);

      expect(actual).toInclude('.cc-hash-test{font-size:var(--var-hash-test)}');
      expect(actual).toInclude('textSize,...props}');
      expect(actual).toInclude('"--var-hash-test":(textSize||"")+"px"');
    });

    it('should inline constant numeric literal', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const fontSize = 20;

        const ListItem = styled.div\`
          font-size: \${fontSize}px;
        \`;
      `);

      expect(actual).toInclude('.cc-hash-test{font-size:20px}');
    });

    it('should move suffix to inline styles when referencing a mutable numeric literal', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        let fontSize = 20;

        const ListItem = styled.div\`
          font-size: \${fontSize}px;
        \`;
      `);

      expect(actual).toInclude('"--var-hash-test":(fontSize||"")+"px"');
      expect(actual).toInclude('.cc-hash-test{font-size:var(--var-hash-test)}');
    });

    it('should move suffix to inline styles when referencing a mutable numeric literal when missing a semi colon', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        let fontSize = 20;

        const ListItem = styled.div\`
          font-size: \${fontSize}px
        \`;
      `);

      expect(actual).toInclude('"--var-hash-test":(fontSize||"")+"px"');
      expect(actual).toInclude('.cc-hash-test{font-size:var(--var-hash-test)}');
    });

    it('should transform a static template literal', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div\`
          font-size: 20px;
        \`;
      `);

      expect(actual).toInclude('.cc-hash-test{font-size:20px}');
    });

    it('should inline constant string literal', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const fontSize = '20px';

        const ListItem = styled.div\`
          font-size: \${fontSize};
        \`;
      `);

      expect(actual).toInclude('.cc-hash-test{font-size:20px}');
    });

    it('should transform template string literal with prop reference', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div\`
          color: \${props => props.color};
        \`;
      `);

      expect(actual).toInclude('.cc-hash-test{color:var(--var-hash-test)');
      expect(actual).toInclude('"--var-hash-test":props.color');
    });

    it('should transform an arrow function with a body into an IIFE', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div\`
          color: \${props => { return props.color; }};
        \`;
      `);

      expect(actual).toInclude('.cc-hash-test{color:var(--var-hash-test)}');
      expect(actual).toInclude('"--var-hash-test":(()=>{return props.color;})()}}');
    });

    it('should transform an arrow function with a body into an IIFE by preventing passing down invalid html attributes to the node', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div\`
          font-size: \${props => { return props.textSize; }};
        \`;
      `);

      expect(actual).toInclude('.cc-hash-test{font-size:var(--var-hash-test)}');
      expect(actual).toInclude('({as:C="div",style,textSize,...props},ref)');
      expect(actual).toInclude('"--var-hash-test":(()=>{return textSize;})()}}');
    });

    it('should move suffix and prefix of a dynamic arrow function with a body into an IIFE', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div\`
          color: very$\{props => { return props.color; }}dark;
        \`;
      `);

      expect(actual).toInclude('.cc-hash-test{color:var(--var-hash-test)}');
      expect(actual).toInclude(
        '"--var-hash-test":"very"+((()=>{return props.color;})()||"")+"dark"'
      );
    });

    it('should move suffix and prefix of a dynamic arrow function with a body into an IIFE by preventing passing down invalid html attributes to the node', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div\`
          font-size: super$\{props => { return props.textSize; }}big;
        \`;
      `);

      expect(actual).toInclude('.cc-hash-test{font-size:var(--var-hash-test)}');
      expect(actual).toInclude('({as:C="div",style,textSize,...props},ref)');
      expect(actual).toInclude('"--var-hash-test":"super"+((()=>{return textSize;})()||"")+"big"');
    });

    it('should transform template string literal with obj variable', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const h200 = { fontSize: '12px' };

        const ListItem = styled.div\`
          \${h200};
          color: blue;
        \`;
      `);

      expect(actual).toInclude('.cc-hash-test{font-size:12px;color:blue}');
    });

    it('should reference identifier pointing to a call expression if it returns simple value', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const em = (str) => str;
        const color = em('blue');

        const ListItem = styled.div\`
          color: \${color};
        \`;
      `);

      expect(actual).toInclude('.cc-hash-test{color:var(--var-hash-test)');
      expect(actual).toInclude('"--var-hash-test":color');
    });

    it('should inline call if it returns simple value', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const em = (str) => str;

        const ListItem = styled.div\`
          color: \${em('blue')};
        \`;
      `);

      expect(actual).toInclude('.cc-hash-test{color:var(--var-hash-test)}');
      expect(actual).toInclude(`"--var-hash-test\":em('blue')`);
    });

    it.todo('should transform template string literal with array variable');

    xit('should transform template string with no argument arrow function variable', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const mixin = () => ({ color: 'red' });

        const ListItem = styled.div\`
          \${mixin()};
        \`;
      `);

      expect(actual).toInclude('.css-test{color:red}');
    });

    it('should move suffix and prefix of a dynamic arrow func property into the style property', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div\`
          font-size: super$\{props => props.color}big;
        \`;
      `);

      expect(actual).toInclude('"--var-hash-test":"super"+(props.color||"")+"big"');
    });

    it('should move any prefix of a dynamic arrow func property into the style property', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div\`
          font-size: super$\{props => props.color};
        \`;
      `);

      expect(actual).toInclude('"--var-hash-test":"super"+(props.color||"")');
    });

    it('should move any suffix of a dynamic arrow func property into the style property', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div\`
          font-size: $\{props => props.color}big;
        \`;
      `);

      expect(actual).toInclude('"--var-hash-test":(props.color||"")+"big"');
    });

    it('should move suffix and prefix of a dynamic property into the style property', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        let color = 'red';
        const ListItem = styled.div\`
          font-size: super$\{color}big;
          color: red;
        \`;
      `);

      expect(actual).toInclude('.cc-hash-test{font-size:var(--var-hash-test);color:red}');
      expect(actual).toInclude('"--var-hash-test":"super"+(color||"")+"big"');
    });

    it('should do nothing with suffix/prefix when referencing constant literal', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const color = 'red';
        const ListItem = styled.div\`
          font-size: super$\{color}big;
          color: red;
        \`;
      `);

      expect(actual).toInclude('.cc-hash-test{font-size:superredbig;color:red}');
    });

    xit('should transform template string with no argument function variable', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        function mixin() {
          return { color: 'red' };
        }

        const ListItem = styled.div\`
          \${mixin()};
        \`;
      `);

      expect(actual).toInclude('.css-test{color:red}');
    });

    it('should only destructure a prop if hasnt been already', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div\`
          > :first-child {
            display: $\{(props) => (props.isShown ? 'none' : 'block')};
          }

          > :last-child {
            opacity: $\{(props) => (props.isShown ? 1 : 0)};
          }
        \`;
      `);

      // `isShown` should be destructured only once.
      expect(actual).toInclude('({as:C="div",style,isShown,...props},ref)');
    });

    xit('should transform an inline expression', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const Div = styled.div\`
          border-radius: \${2 + 2}px;
          color: blue;
        \`;
      `);

      // 2+2 should be evaluated to 4
      expect(actual).toInclude('.cc-hash-test{border-radius:4px;color:blue}');
    });

    it('should transform identifier referencing an expression with suffix', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        let br = 2 + 2;
        const Div = styled.div\`
          border-radius: \${br}px;
          color: red;
        \`;
      `);

      expect(actual).toInclude('.cc-hash-test{border-radius:var(--var-hash-test);color:red}');
      expect(actual).toInclude('"--var-hash-test":(br||"")+"px"');
    });

    xit('should transform inline arrow function with suffix', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const getBr = () => 4;
        const Div = styled.div\`
          border-radius: \${getBr}px;
          color: red;
        \`;
      `);

      expect(actual).toInclude('.cc-hash-test{border-radius:4px;color:red}');
    });

    xit('should transform arrow function call that returns css like object', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const getBr = () => ({ fontSize: 12 });
        const Div = styled.div\`
          \${getBr()};
          color: red;
        \`;
      `);

      expect(actual).toInclude('.cc-hash-test{font-size:12px;color:red}');
    });

    xit('should transform arrow function call that returns number', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const getBr = () => 12;
        const Div = styled.div\`
          font-size: \${getBr()}px;
          color: red;
        \`;
      `);

      expect(actual).toInclude('.cc-hash-test{font-size:12px;color:red}');
    });

    xit('should transform arrow function call that has a complex body', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const getBr = () => {
          return true ? '1' : '2';
        };
        const Div = styled.div\`
          font-size: \${getBr()}px;
          color: red;
        \`;
      `);

      expect(actual).toInclude('.cc-hash-test{font-size:var(--var-hash-test);color:red}');
      expect(actual).toInclude('"--var-hash-test":(getBr()||"")+"px"');
    });

    it.todo('should transform template string with argument function variable');

    it.todo('should transform template string with argument arrow function variable');
  });

  describe('using an object literal', () => {
    it('should respect the definition of pseudo element content ala emotion with double quotes', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';
        const ListItem = styled.div({
          ':after': {
            content: '""',
          },
        });
      `);

      expect(actual).toInclude('.cc-hash-test:after{content:\\"\\"}');
    });

    xit('should add quotations to dynamically set content', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';
        const ListItem = styled.div({
          ':after': {
            content: props => props.content,
          },
        });
      `);

      expect(actual).toInclude(`"--var-hash-test":'"'+props.content+'"'`);
      expect(actual).toInclude('.cc-hash-test:after{content:var(--var-hash-test)}');
    });

    it('should respect the definition of pseudo element content ala emotion with single quotes', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';
        const ListItem = styled.div({
          ':after': {
            content: "''",
          },
        });
      `);

      expect(actual).toInclude(".cc-hash-test:after{content:''}");
    });

    it('should respect the definition of pseudo element content ala styled components with no content', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';
        const ListItem = styled.div({
          ':after': {
            content: '',
          },
        });
      `);

      expect(actual).toInclude('.cc-hash-test:after{content:\\"\\"}');
    });

    it('should respect the definition of pseudo element content ala styled components with content', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';
        const ListItem = styled.div({
          ':after': {
            content: '😎',
          },
        });
      `);

      expect(actual).toInclude('.cc-hash-test:after{content:\\"\\uD83D\\uDE0E\\"}');
    });

    it('should append "px" on numeric literals if missing', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';
        const ListItem = styled.div({
          fontSize: 12,
        });
      `);

      expect(actual).toInclude('.cc-hash-test{font-size:12px}');
    });

    it('should reference property access expression', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';
        let color = { blue: 'red' };

        styled.div({
          background: color.blue,
        });
      `);

      expect(actual).toInclude('.cc-hash-test{background:var(--var-hash-test)}');
      expect(actual).toInclude('"--var-hash-test":color.blue');
    });

    it('should not pass down invalid html attributes to the node when property has a suffix', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';
        const ListItem = styled.div({
          fontSize: props => \`\${props.textSize}px\`,
        });
      `);

      expect(actual).toInclude('.cc-hash-test{font-size:var(--var-hash-test)}');
      expect(actual).toInclude('({as:C="div",style,textSize,...props},ref)');
      expect(actual).toInclude('"--var-hash-test":`${textSize}px`');
    });

    it('should not pass down invalid html attributes to the node when property has a suffix when func in template literal', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';
        const ListItem = styled.div({
          fontSize: \`\${props => props.textSize}px\`,
        });
      `);

      expect(actual).toInclude('.cc-hash-test{font-size:var(--var-hash-test)}');
      expect(actual).toInclude('({as:C="div",style,textSize,...props},ref)');
      expect(actual).toInclude('"--var-hash-test":(textSize||"")+"px"');
    });

    it('should transform object with simple values', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div({
          color: 'blue',
          margin: 0,
        });
      `);

      expect(actual).toInclude('.cc-hash-test{color:blue;margin:0}');
    });

    it('should transform object with nested object into a selector', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div({
          ':hover': {
            color: 'blue',
            margin: 0,
          },
        });
      `);

      expect(actual).toInclude('.cc-hash-test:hover{color:blue;margin:0}');
    });

    it('should reference identifier pointing to a call expression if it returns simple value', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const em = (str) => str;
        const color = em('blue');

        const ListItem = styled.div({
          color,
        });
      `);

      expect(actual).toInclude('.cc-hash-test{color:var(--var-hash-test)}');
      expect(actual).toInclude('"--var-hash-test":color');
    });

    it('should inline call if it returns simple value', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const em = (str) => str;

        const ListItem = styled.div({
          color: em('blue'),
        });
      `);

      expect(actual).toInclude('.cc-hash-test{color:var(--var-hash-test)}');
      expect(actual).toInclude('"--var-hash-test":em(\'blue\')');
    });

    it('should inline constant string literal', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const color = 'blue';

        const ListItem = styled.div({
          color,
        });
      `);

      expect(actual).toInclude('.cc-hash-test{color:blue}');
    });

    it('should transform template object with prop reference', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div({
          color: props => props.color,
        });
      `);

      expect(actual).toInclude('.cc-hash-test{color:var(--var-hash-test)}');
      expect(actual).toInclude('"--var-hash-test":props.color');
    });

    it('should transform object spread from variable', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const h100 = { fontSize: '12px' };

        const ListItem = styled.div({
          ...h100,
          color: 'red',
        });
      `);

      expect(actual).toInclude('.cc-hash-test{font-size:12px;color:red}');
    });

    it('should transform object with mutable identifier', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        let color = 'blue';

        const ListItem = styled.div({
          color: color,
        });
      `);

      expect(actual).toInclude('.cc-hash-test{color:var(--var-hash-test)}');
      expect(actual).toInclude('"--var-hash-test":color');
    });

    it('should transform object with obj variable', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const hover = { color: 'red' };

        const ListItem = styled.div({
          fontSize: '20px',
          ':hover': hover,
        });
      `);

      expect(actual).toInclude('.cc-hash-test{font-size:20px}');
      expect(actual).toInclude('.cc-hash-test:hover{color:red}');
    });

    it.todo('should transform object with array variable');

    xit('should transform object with no argument arrow function variable', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        const mixin = () => ({ color: 'red' });

        const ListItem = styled.div({
          ...mixin(),
        });
      `);

      expect(actual).toInclude('.cc-hash-test{color:red}');
    });

    xit('should transform object with no argument function variable', () => {
      const actual = transform(`
        import { styled } from '@compiled/core';

        function mixin() {
          return { color: 'red' };
        }

        const ListItem = styled.div({
          ...mixin(),
        });
      `);

      expect(actual).toInclude('.cc-hash-test{color:red}');
    });

    it.todo('should transform object with argument function variable');

    it.todo('should transform object with argument arrow function variable');
  });

  it('should inline constant identifier string literal', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';

      const fontSize = '20px';

      const ListItem = styled.div\`
        font-size: \${fontSize};
      \`;
    `);

    expect(actual).toInclude('.cc-hash-test{font-size:20px}');
  });

  it('should transform an arrow function with a body into an IIFE', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';

      const ListItem = styled.div({
        color: props => { return props.color; },
      });
    `);

    expect(actual).toInclude('.cc-hash-test{color:var(--var-hash-test)}');
    expect(actual).toInclude('"--var-hash-test":(()=>{return props.color;})()}}');
  });

  it('should transform an arrow function with a body into an IIFE by preventing passing down invalid html attributes to the node', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';

      const ListItem = styled.div({
        fontSize: props => { return props.textSize; },
      });
    `);

    expect(actual).toInclude('.cc-hash-test{font-size:var(--var-hash-test)}');
    expect(actual).toInclude('({as:C="div",style,textSize,...props},ref)');
    expect(actual).toInclude('"--var-hash-test":(()=>{return textSize;})()}}');
  });

  it('should move suffix and prefix of a dynamic arrow function with a body into an IIFE', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';

      const ListItem = styled.div({
        color: \`very$\{props => { return props.color; }}dark\`
      });
    `);

    expect(actual).toInclude('.cc-hash-test{color:var(--var-hash-test)}');
    expect(actual).toInclude('"--var-hash-test":"very"+((()=>{return props.color;})()||"")+"dark"');
  });

  it('should move suffix and prefix of a dynamic arrow function with a body into an IIFE by preventing passing down invalid html attributes to the node', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';

      const ListItem = styled.div({
        fontSize: \`super$\{props => { return props.textSize; }}big\`
      });
    `);

    expect(actual).toInclude('.cc-hash-test{font-size:var(--var-hash-test)}');
    expect(actual).toInclude('({as:C="div",style,textSize,...props},ref)');
    expect(actual).toInclude('"--var-hash-test":"super"+((()=>{return textSize;})()||"")+"big"');
  });
});
