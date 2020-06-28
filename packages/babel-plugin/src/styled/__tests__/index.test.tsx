import { transformSync } from '@babel/core';
import babelNext from '../../next';

jest.mock('@compiled/ts-transform-css-in-js/dist/utils/hash');

const transform = (code: string) => {
  return transformSync(code, {
    configFile: false,
    babelrc: false,
    compact: true,
    plugins: [babelNext],
  })?.code;
};

describe('styled component transformer', () => {
  it('should generate styled object component code', () => {
    const actual = transform(`
      import { styled } from '@compiled/css-in-js';

      const ListItem = styled.div({
        fontSize: '20px',
      });
    `);

    expect(actual).toMatchInlineSnapshot(`
      "import{CC,CS}from'@compiled/css-in-js';const ListItem=React.forwardRef(({as:C=\\"div\\",...props},ref)=><CC>
            <CS hash={\\"hash-test\\"}>{[\\".cc-hash-test{font-size:20px}\\"]}</CS>
            <C{...props}ref={ref}className={\\"cc-hash-test\\"+(props.className?\\" \\"+props.className:\\"\\")}/>
          </CC>);"
    `);
  });

  it('should generate styled template literal component code', () => {
    const actual = transform(`
      import { styled } from '@compiled/css-in-js';

      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toMatchInlineSnapshot(`
      "import{CC,CS}from'@compiled/css-in-js';const ListItem=React.forwardRef(({as:C=\\"div\\",...props},ref)=><CC>
            <CS hash={\\"hash-test\\"}>{[\\".cc-hash-test{font-size:20px}\\"]}</CS>
            <C{...props}ref={ref}className={\\"cc-hash-test\\"+(props.className?\\" \\"+props.className:\\"\\")}/>
          </CC>);"
    `);
  });

  xit('should not pass down invalid html attributes to the node', () => {
    const actual = transform(`
      import { styled } from '@compiled/css-in-js';
      const ListItem = styled.div({
        fontSize: props => props.textSize,
      });
    `);

    expect(actual).toInclude('textSize, ...props }');
    expect(actual).toInclude('"--var-test-propstextsize": textSize');
  });

  xit('should remove styled import', () => {
    const actual = transform(`
      import { styled } from '@compiled/css-in-js';
      const ListItem = styled.div({
        fontSize: '20px',
      });
    `);

    expect(actual).not.toInclude(`import { styled } from '@compiled/css-in-js';`);
  });

  xit('should replace string literal styled component with component', () => {
    const actual = transform(`
      import { styled } from '@compiled/css-in-js';
      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toMatchInlineSnapshot(`
      "import React from \\"react\\";
      import { CC, CS } from '@compiled/css-in-js';
      const ListItem = /*#__PURE__*/ React.forwardRef(({ as: C = \\"div\\", ...props }, ref) => <CC><CS hash=\\"css-test\\">{[\\".css-test{font-size:20px}\\"]}</CS><C {...props} ref={ref} className={\\"css-test\\" + (props.className ? \\" \\" + props.className : \\"\\")}/></CC>);
      if (process.env.NODE_ENV === \\"development\\") {
          ListItem.displayName = \\"ListItem\\";
      }
      "
    `);
  });

  xit('should shortcircuit props with suffix to a empty string to avoid undefined in css', () => {
    const actual = transform(`
      import { styled } from '@compiled/css-in-js';

      const ListItem = styled.div\`
        font-size: \${props => props.color}px;
      \`;
    `);

    expect(actual).toInclude('"--var-test-propscolor": (props.color || "") + "px"');
  });

  xit('should add react default import if missing', () => {
    const actual = transform(`
      import { styled } from '@compiled/css-in-js';
      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude('import React from "react";');
  });

  xit('should add react default import if it only has named imports', () => {
    const actual = transform(`
      import { useState } from 'react';
      import { styled } from '@compiled/css-in-js';
      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude(`import React, { useState } from 'react';`);
  });

  xit('should spread down props to element', () => {
    const actual = transform(`
      import { styled } from '@compiled/css-in-js';

      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude('<C {...props}');
  });

  xit('should set a display name behind a dev flag', () => {
    const actual = transform(`
      import { styled } from '@compiled/css-in-js';

      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude('ListItem.displayName = "ListItem";');
  });

  xit('should do nothing if react default import is already defined', () => {
    const actual = transform(`
      import React from 'react';
      import { styled } from '@compiled/css-in-js';
      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude("import React from 'react';");
  });

  xit('should compose a component using template literal', () => {
    const actual = transform(`
      import React from 'react';
      import { styled } from '@compiled/css-in-js';

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
      import { styled } from '@compiled/css-in-js';

      const Component = () => null;

      const ListItem = styled(Component)({
        fontSize: 20
      });
    `);

    expect(actual).toInclude('as: C = Component');
  });

  xit('should concat class name prop if defined', () => {
    const actual = transform(`
      import { styled } from '@compiled/css-in-js';
      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude(
      `className={\"css-test\" + (props.className ? \" \" + props.className : \"\")}`
    );
  });

  describe('using a string literal', () => {
    xit('should respect missing units', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';
        const ListItem = styled.div\`
          font-size: 12;
        \`;
      `);

      expect(actual).toInclude('.css-test{font-size:12}');
    });

    xit('should not pass down invalid html attributes to the node when property has a suffix', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';
        const ListItem = styled.div\`
          font-size: \${props => props.textSize}px;
        \`;
      `);

      expect(actual).toInclude('.css-test{font-size:var(--var-test-propstextsize)}');
      expect(actual).toInclude('textSize, ...props }');
      expect(actual).toInclude('"--var-test-propstextsize": (textSize || "") + "px"');
    });

    xit('should persist suffix of dynamic property value into inline styles', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const fontSize = 20;

        const ListItem = styled.div\`
          font-size: \${fontSize}px;
        \`;
      `);

      expect(actual).toInclude('.css-test{font-size:20px}');
    });

    xit('should persist suffix of dynamic property value into inline styles when missing a semi colon', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const fontSize = 20;

        const ListItem = styled.div\`
          font-size: \${fontSize}px
        \`;
      `);

      expect(actual).toInclude('.css-test{font-size:20px}');
    });

    xit('should transform no template string literal', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const ListItem = styled.div\`
          font-size: 20px;
        \`;
      `);

      expect(actual).toInclude('.css-test{font-size:20px}');
    });

    xit('should transform template string literal with string variable', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const fontSize = '20px';

        const ListItem = styled.div\`
          font-size: \${fontSize};
        \`;
      `);

      expect(actual).toInclude('.css-test{font-size:20px}');
    });

    xit('should transform template string literal with numeric variable', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const margin = 0;

        const ListItem = styled.div\`
          margin: \${margin};
        \`;
      `);

      expect(actual).toInclude('.css-test{margin:0}');
    });

    xit('should transform template string literal with prop reference', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const ListItem = styled.div\`
          color: \${props => props.color};
        \`;
      `);

      expect(actual).toInclude('.css-test{color:var(--var-test-propscolor)}');
      expect(actual).toInclude('"--var-test-propscolor": props.color }}');
    });

    xit('should transform a arrow function with a body into an IIFE', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const ListItem = styled.div\`
          color: \${props => { return props.color; }};
        \`;
      `);

      expect(actual).toInclude('.css-test{color:var(--var-test-propscolor)}');
      expect(actual).toInclude('"--var-test-propscolor": (() => { return props.color; })() }}');
    });

    xit('should transform template string literal with obj variable', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const h200 = { fontSize: '12px' };

        const ListItem = styled.div\`
          \${h200};
        \`;
      `);

      expect(actual).toInclude('.css-test{font-size:12px}');
    });

    xit('should reference identifier pointing to a call expression if it returns simple value', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const em = (str: string) => str;
        const color = em('blue');

        const ListItem = styled.div\`
          color: \${color};
        \`;
      `);

      expect(actual).toInclude('.css-test{color:var(--var-test-color)}');
      expect(actual).toInclude('"--var-test-color": color }}');
    });

    xit('should inline call if it returns simple value', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const em = (str: string) => str;

        const ListItem = styled.div\`
          color: \${em('blue')};
        \`;
      `);

      expect(actual).toInclude('.css-test{color:var(--var-test-emblue)}');
      expect(actual).toInclude('"--var-test-emblue": em(\'blue\') }}');
    });

    it.todo('should transform template string literal with array variable');

    xit('should transform template string with no argument arrow function variable', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const mixin = () => ({ color: 'red' });

        const ListItem = styled.div\`
          \${mixin()};
        \`;
      `);

      expect(actual).toInclude('.css-test{color:red}');
    });

    xit('should move suffix and prefix of a dynamic arrow func property into the style property', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const ListItem = styled.div\`
          font-size: super$\{props => props.color}big;
        \`;
      `);

      expect(actual).toInclude('"--var-test-propscolor": "super" + (props.color || "") + "big"');
    });

    xit('should move any prefix of a dynamic arrow func property into the style property', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const ListItem = styled.div\`
          font-size: super$\{props => props.color};
        \`;
      `);

      expect(actual).toInclude('"--var-test-propscolor": "super" + (props.color || "")');
    });

    xit('should move suffix and prefix of a dynamic property into the style property', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const color = 'red';
        const ListItem = styled.div\`
          font-size: super$\{color}big;
        \`;
      `);

      expect(actual).toInclude('.css-test{font-size:superredbig}');
    });

    xit('should move any prefix of a dynamic property into the style property', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const color = 'red';
        const ListItem = styled.div\`
          font-size: super$\{color};
        \`;
      `);

      expect(actual).toInclude('.css-test{font-size:superred}');
    });

    xit('should transform template string with no argument function variable', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        function mixin() {
          return { color: 'red' };
        }

        const ListItem = styled.div\`
          \${mixin()};
        \`;
      `);

      expect(actual).toInclude('.css-test{color:red}');
    });

    xit('should only destructure a prop if hasnt been already', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const ListItem = styled.div\`
          > :first-child {
            display: $\{(props) => (props.isShown ? 'none' : 'block')};
          }

          > :last-child {
            opacity: $\{(props) => (props.isShown ? 1 : 0)};
          }
        \`;
      `);

      expect(actual).toInclude('isShown, ...props }');
    });

    xit('should not blow up when using a unknown variable import string literal', () => {});

    xit('should not blow up when using a unknown variable import object literal', () => {});

    xit('should transform an inline expression', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const Div = styled.div\`
          border-radius: \${2 + 2}px;
          color: blue;
        \`;
      `);

      expect(actual).toInclude(
        '<CS hash="css-test">{[".css-test{border-radius:var(--var-test-2+2);color:blue}"]}</CS>'
      );
    });

    xit('should transform identifier referencing an expression with suffix', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const br = 2 + 2;
        const Div = styled.div\`
          border-radius: \${br}px;
          color: red;
        \`;
      `);

      expect(actual).toInclude(
        '<CS hash="css-test">{[".css-test{border-radius:var(--var-test-br);color:red}"]}</CS>'
      );
      expect(actual).toInclude('style={{ ...props.style, "--var-test-br": (br || "") + "px" }}');
    });

    xit('should transform inline arrow function with suffix', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const getBr = () => 4;
        const Div = styled.div\`
          border-radius: \${getBr}px;
          color: red;
        \`;
      `);

      expect(actual).toInclude(
        '<CS hash="css-test">{[".css-test{border-radius:4px;color:red}"]}</CS>'
      );
    });

    xit('should transform arrow function call that returns css like object', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const getBr = () => ({ fontSize: 12 });
        const Div = styled.div\`
          \${getBr()};
          color: red;
        \`;
      `);

      expect(actual).toInclude(
        '<CS hash="css-test">{[".css-test{font-size:12px;color:red}"]}</CS>'
      );
    });

    xit('should transform arrow function call that returns number', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const getBr = () => 12;
        const Div = styled.div\`
          font-size: \${getBr()}px;
          color: red;
        \`;
      `);

      expect(actual).toInclude(
        '<CS hash="css-test">{[".css-test{font-size:12px;color:red}"]}</CS>'
      );
    });

    xit('should transform arrow function call that has a complex body', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const getBr = () => {
          return true ? 'red' : 'blue';
        };
        const Div = styled.div\`
          font-size: \${getBr()}px;
          color: red;
        \`;
      `);

      expect(actual).toInclude(
        '<CS hash="css-test">{[".css-test{font-size:var(--var-test-getbr);color:red}"]}</CS>'
      );
      expect(actual).toInclude(
        'style={{ ...props.style, "--var-test-getbr": (getBr() || "") + "px" }}'
      );
    });

    it.todo('should transform template string with argument function variable');

    it.todo('should transform template string with argument arrow function variable');
  });

  describe('using an object literal', () => {
    xit('should respect the definition of pseudo element content ala emotion with double quotes', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';
        const ListItem = styled.div({
          ':after': {
            content: '""',
          },
        });
      `);

      expect(actual).toInclude('.css-test:after{content:\\"\\"}');
    });

    xit('should add quotations to dynamically set content', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';
        const ListItem = styled.div({
          ':after': {
            content: props => props.content,
          },
        });
      `);

      expect(actual).toInclude(`"--var-test": '"' + props.content + '"'`);
      expect(actual).toInclude('.css-test:after{content:var(--var-test)}');
    });

    xit('should respect the definition of pseudo element content ala emotion with single quotes', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';
        const ListItem = styled.div({
          ':after': {
            content: "''",
          },
        });
      `);

      expect(actual).toInclude(".css-test:after{content:''}");
    });

    xit('should respect the definition of pseudo element content ala styled components with no content', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';
        const ListItem = styled.div({
          ':after': {
            content: '',
          },
        });
      `);

      expect(actual).toInclude('.css-test:after{content:\\"\\"}');
    });

    xit('should respect the definition of pseudo element content ala styled components with content', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';
        const ListItem = styled.div({
          ':after': {
            content: '😎',
          },
        });
      `);

      expect(actual).toInclude('.css-test:after{content:\\"\\uD83D\\uDE0E\\"}');
    });

    xit('should append "px" on numeric literals if missing', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';
        const ListItem = styled.div({
          fontSize: 12,
        });
      `);

      expect(actual).toInclude('.css-test{font-size:12px}');
    });

    xit('should reference property access expression', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';
        const color = { blue: 'red' };

        styled.div({
          background: color.blue,
        });
      `);

      expect(actual).toInclude('"--var-test-colorblue": color.blue');
    });

    xit('should not pass down invalid html attributes to the node when property has a suffix', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';
        const ListItem = styled.div({
          fontSize: props => \`\${props.textSize}px\`,
        });
      `);

      expect(actual).toInclude('.css-test{font-size:var(--var-test-propstextsizepx)}');
      expect(actual).toInclude('textSize, ...props }');
      expect(actual).toInclude('"--var-test-propstextsizepx": `${textSize}px`');
    });

    xit('should not pass down invalid html attributes to the node when property has a suffix when func in template literal', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';
        const ListItem = styled.div({
          fontSize: \`\${props => props.textSize}px\`,
        });
      `);

      expect(actual).toInclude('textSize, ...props }');
      expect(actual).toInclude('.css-test{font-size:var(--var-test-propstextsize)}');
      expect(actual).toInclude('"--var-test-propstextsize": (textSize || "") + "px"');
    });

    xit('should persist suffix of dynamic property value into inline styles', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const fontSize = 20;

        const ListItem = styled.div({
          fontSize: \`\${props => props.fontSize}px\`,
        });
      `);

      expect(actual).toInclude('"--var-test-propsfontsize": (props.fontSize || "") + "px" }}');
      expect(actual).toInclude('.css-test{font-size:var(--var-test-propsfontsize)}');
    });

    xit('should transform object with simple values', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const ListItem = styled.div({
          color: 'blue',
          margin: 0,
        });
      `);

      expect(actual).toInclude('.css-test{color:blue;margin:0}');
    });

    xit('should transform object with nested object into a selector', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const ListItem = styled.div({
          ':hover': {
            color: 'blue',
            margin: 0,
          },
        });
      `);

      expect(actual).toInclude('.css-test:hover{color:blue;margin:0}');
    });

    xit('should reference identifier pointing to a call expression if it returns simple value', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const em = (str: string) => str;
        const color = em('blue');

        const ListItem = styled.div({
          color,
        });
      `);

      expect(actual).toInclude('.css-test{color:var(--var-test-color)}');
      expect(actual).toInclude('"--var-test-color": color }}');
    });

    xit('should inline call if it returns simple value', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const em = (str: string) => str;

        const ListItem = styled.div({
          color: em('blue'),
        });
      `);

      expect(actual).toInclude('.css-test{color:var(--var-test-emblue)}');
      expect(actual).toInclude('"--var-test-emblue": em(\'blue\') }}');
    });

    xit('should transform template object with string variable', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const color = 'blue';

        const ListItem = styled.div({
          color,
        });
      `);

      expect(actual).toInclude('.css-test{color:blue}');
    });

    xit('should transform template object with prop reference', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const ListItem = styled.div({
          color: props => props.color,
        });
      `);

      expect(actual).toInclude('.css-test{color:var(--var-test-propscolor)}');
      expect(actual).toInclude('"--var-test-propscolor": props.color }}');
    });

    xit('should transform object spread from variable', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const h100 = { fontSize: '12px' };

        const ListItem = styled.div({
          ...h100,
        });
      `);

      expect(actual).toInclude('.css-test{font-size:12px}');
    });

    xit('should transform object with string variable', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const color = 'blue';

        const ListItem = styled.div({
          color: color,
        });
      `);

      expect(actual).toInclude('.css-test{color:blue}');
    });

    xit('should transform object with obj variable', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const hover = { color: 'red' };

        const ListItem = styled.div({
          fontSize: '20px',
          ':hover': hover,
        });
      `);

      expect(actual).toInclude('.css-test{font-size:20px}');
      expect(actual).toInclude('.css-test:hover{color:red}');
    });

    it.todo('should transform object with array variable');

    xit('should transform object with no argument arrow function variable', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        const mixin = () => ({ color: 'red' });

        const ListItem = styled.div({
          ...mixin(),
        });
      `);

      expect(actual).toInclude('.css-test{color:red}');
    });

    xit('should transform object with no argument function variable', () => {
      const actual = transform(`
        import { styled } from '@compiled/css-in-js';

        function mixin() {
          return { color: 'red' };
        }

        const ListItem = styled.div({
          ...mixin(),
        });
      `);

      expect(actual).toInclude('.css-test{color:red}');
    });

    it.todo('should transform object with argument function variable');

    it.todo('should transform object with argument arrow function variable');
  });

  xit('should transform template string literal with string variable', () => {
    const actual = transform(`
      import { styled } from '@compiled/css-in-js';

      const fontSize = '20px';

      const ListItem = styled.div\`
        font-size: \${fontSize};
      \`;
    `);

    expect(actual).toInclude('.css-test{font-size:20px}');
  });
});
