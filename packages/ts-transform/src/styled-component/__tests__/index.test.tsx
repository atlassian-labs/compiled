import * as ts from 'typescript';
import { Transformer } from 'ts-transformer-testing-library';
import styledComponentTransformer from '../index';

jest.mock('../../utils/hash');

const transformer = new Transformer()
  .addTransformer(styledComponentTransformer)
  .addMock({
    name: 'react',
    content: 'export const useState: any = {}; export default () => {} as any;',
  })
  .addMock({ name: '@compiled/css-in-js', content: `export const styled: any = () => null` })
  .setFilePath('/index.tsx');

describe('styled component transformer', () => {
  it('should replace object literal styled component with component', () => {
    const actual = transformer.transform(`
      import { styled } from '@compiled/css-in-js';
      const ListItem = styled.div({
        fontSize: '20px',
      });
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

  it('should not pass down invalid html attributes to the node', () => {
    const actual = transformer.transform(`
      import { styled } from '@compiled/css-in-js';
      const ListItem = styled.div({
        fontSize: props => props.textSize,
      });
    `);

    expect(actual).toInclude('textSize, ...props }');
    expect(actual).toInclude('"--var-test-propstextsize": textSize');
  });

  it('should add an identifier nonce to the style element', () => {
    const stubProgam: ts.Program = ({
      getTypeChecker: () => ({
        getSymbolAtLocation: () => undefined,
      }),
    } as never) as ts.Program;
    const transformer = styledComponentTransformer(stubProgam, { nonce: '__webpack_nonce__' });

    const actual = ts.transpileModule(
      `
        import { styled } from '@compiled/css-in-js';
        const ListItem = styled.div({
          fontSize: '20px',
        });
      `,
      {
        transformers: { before: [transformer] },
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          jsx: ts.JsxEmit.Preserve,
          target: ts.ScriptTarget.ESNext,
        },
      }
    );

    expect(actual.outputText).toInclude('<CS hash="css-test" nonce={__webpack_nonce__}>');
  });

  it('should remove styled import', () => {
    const actual = transformer.transform(`
      import { styled } from '@compiled/css-in-js';
      const ListItem = styled.div({
        fontSize: '20px',
      });
    `);

    expect(actual).not.toInclude(`import { styled } from '@compiled/css-in-js';`);
  });

  it('should replace string literal styled component with component', () => {
    const actual = transformer.transform(`
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

  it('should add react default import if missing', () => {
    const actual = transformer.transform(`
      import { styled } from '@compiled/css-in-js';
      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude('import React from "react";');
  });

  it('should add react default import if it only has named imports', () => {
    const actual = transformer.transform(`
      import { useState } from 'react';
      import { styled } from '@compiled/css-in-js';
      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude(`import React, { useState } from 'react';`);
  });

  it('should spread down props to element', () => {
    const actual = transformer.transform(`
      import { styled } from '@compiled/css-in-js';

      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude('<C {...props}');
  });

  it('should set a display name behind a dev flag', () => {
    const actual = transformer.transform(`
      import { styled } from '@compiled/css-in-js';

      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude('ListItem.displayName = "ListItem";');
  });

  it('should do nothing if react default import is already defined', () => {
    const actual = transformer.transform(`
      import React from 'react';
      import { styled } from '@compiled/css-in-js';
      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude("import React from 'react';");
  });

  it('should compose a component using template literal', () => {
    const actual = transformer.transform(`
      import React from 'react';
      import { styled } from '@compiled/css-in-js';

      const Component = () => null;

      const ListItem = styled(Component)\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude('as: C = Component');
  });

  it('should compose a component using object literal', () => {
    const actual = transformer.transform(`
      import React from 'react';
      import { styled } from '@compiled/css-in-js';

      const Component = () => null;

      const ListItem = styled(Component)({
        fontSize: 20
      });
    `);

    expect(actual).toInclude('as: C = Component');
  });

  it('should concat class name prop if defined', () => {
    const actual = transformer.transform(`
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
    it('should respect missing units', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';
        const ListItem = styled.div\`
          font-size: 12;
        \`;
      `);

      expect(actual).toInclude('.css-test{font-size:12}');
    });

    it('should not pass down invalid html attributes to the node when property has a suffix', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';
        const ListItem = styled.div\`
          font-size: \${props => props.textSize}px;
        \`;
      `);

      expect(actual).toInclude('.css-test{font-size:var(--var-test-propstextsize)}');
      expect(actual).toInclude('textSize, ...props }');
      expect(actual).toInclude('"--var-test-propstextsize": textSize + "px"');
    });

    it('should persist suffix of dynamic property value into inline styles', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const fontSize = 20;

        const ListItem = styled.div\`
          font-size: \${fontSize}px;
        \`;
      `);

      expect(actual).toInclude('.css-test{font-size:20px}');
    });

    it('should persist suffix of dynamic property value into inline styles when missing a semi colon', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const fontSize = 20;

        const ListItem = styled.div\`
          font-size: \${fontSize}px
        \`;
      `);

      expect(actual).toInclude('.css-test{font-size:20px}');
    });

    it('should transform no template string literal', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const ListItem = styled.div\`
          font-size: 20px;
        \`;
      `);

      expect(actual).toInclude('.css-test{font-size:20px}');
    });

    it('should transform template string literal with string variable', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const fontSize = '20px';

        const ListItem = styled.div\`
          font-size: \${fontSize};
        \`;
      `);

      expect(actual).toInclude('.css-test{font-size:20px}');
    });

    it('should transform template string literal with numeric variable', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const margin = 0;

        const ListItem = styled.div\`
          margin: \${margin};
        \`;
      `);

      expect(actual).toInclude('.css-test{margin:0}');
    });

    it('should transform template string literal with prop reference', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const ListItem = styled.div\`
          color: \${props => props.color};
        \`;
      `);

      expect(actual).toInclude('.css-test{color:var(--var-test-propscolor)}');
      expect(actual).toInclude('"--var-test-propscolor": props.color }}');
    });

    it('should transform a arrow function with a body into an IIFE', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const ListItem = styled.div\`
          color: \${props => { return props.color; }};
        \`;
      `);

      expect(actual).toInclude('.css-test{color:var(--var-test-propscolor)}');
      expect(actual).toInclude('"--var-test-propscolor": (() => { return props.color; })() }}');
    });

    it('should transform template string literal with string import', () => {
      const actual = transformer.addSource({
        path: '/fonts.ts',
        contents: 'export const fontSize = "20px";',
      }).transform(`
        import { styled } from '@compiled/css-in-js';
        import { fontSize } from './fonts';

        const ListItem = styled.div\`
          font-size: \${fontSize};
        \`;
      `);

      expect(actual).toInclude('.css-test{font-size:20px}');
    });

    it('should transform template string literal with obj variable', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const h200 = { fontSize: '12px' };

        const ListItem = styled.div\`
          \${h200};
        \`;
      `);

      expect(actual).toInclude('.css-test{font-size:12px}');
    });

    it('should transform template string literal with obj import', () => {
      const actual = transformer.addSource({
        path: '/typo.ts',
        contents: `export const h200 = { fontSize: '12px' };`,
      }).transform(`
        import { styled } from '@compiled/css-in-js';
        import { h200 } from './typo';

        const ListItem = styled.div\`
          \${h200};
        \`;
      `);

      expect(actual).toInclude('.css-test{font-size:12px}');
    });

    it('should reference identifier pointing to a call expression if it returns simple value', () => {
      const actual = transformer.transform(`
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

    it('should inline call if it returns simple value', () => {
      const actual = transformer.transform(`
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

    it.todo('should transform template string literal with array import');

    it('should transform template string with no argument arrow function variable', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const mixin = () => ({ color: 'red' });

        const ListItem = styled.div\`
          \${mixin()};
        \`;
      `);

      expect(actual).toInclude('.css-test{color:red}');
    });

    it('should transform template string with no argument arrow function import', () => {
      const actual = transformer.addSource({
        path: '/mixin.ts',
        contents: "export const mixin = () => ({ color: 'red' });",
      }).transform(`
        import { styled } from '@compiled/css-in-js';
        import { mixin } from './mixin';

        const ListItem = styled.div\`
          \${mixin()};
        \`;
      `);

      expect(actual).toInclude('.css-test{color:red}');
    });

    it('should move suffix and prefix of a dynamic arrow func property into the style property', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const ListItem = styled.div\`
          font-size: super$\{props => props.color}big;
        \`;
      `);

      expect(actual).toInclude('"--var-test-propscolor": "super" + props.color + "big"');
    });

    it('should move any prefix of a dynamic arrow func property into the style property', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const ListItem = styled.div\`
          font-size: super$\{props => props.color};
        \`;
      `);

      expect(actual).toInclude('"--var-test-propscolor": "super" + props.color');
    });

    it('should move suffix and prefix of a dynamic property into the style property', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const color = 'red';
        const ListItem = styled.div\`
          font-size: super$\{color}big;
        \`;
      `);

      expect(actual).toInclude('.css-test{font-size:superredbig}');
    });

    it('should move any prefix of a dynamic property into the style property', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const color = 'red';
        const ListItem = styled.div\`
          font-size: super$\{color};
        \`;
      `);

      expect(actual).toInclude('.css-test{font-size:superred}');
    });

    it('should transform template string with no argument function variable', () => {
      const actual = transformer.transform(`
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

    it('should only destructure a prop if hasnt been already', () => {
      const actual = transformer.transform(`
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

    it('should transform template string with no argument function import', () => {
      const actual = transformer.addSource({
        path: '/func-mixin.ts',
        contents: `
          export function mixin() {
            return { color: 'red' };
          }
        `,
      }).transform(`
        import { styled } from '@compiled/css-in-js';
        import { mixin } from './func-mixin';

        const ListItem = styled.div\`
          \${mixin()};
        \`;
      `);

      expect(actual).toInclude('.css-test{color:red}');
    });

    it.todo('should transform template string with argument function variable');

    it.todo('should transform template string with argument function import');

    it.todo('should transform template string with argument arrow function variable');

    it.todo('should transform template string with argument arrow function import');
  });

  describe('using an object literal', () => {
    it('should respect the definition of pseudo element content ala emotion with double quotes', () => {
      const actual = transformer.transform(`
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
      const actual = transformer.transform(`
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

    it('should respect the definition of pseudo element content ala emotion with single quotes', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';
        const ListItem = styled.div({
          ':after': {
            content: "''",
          },
        });
      `);

      expect(actual).toInclude(".css-test:after{content:''}");
    });

    it('should respect the definition of pseudo element content ala styled components with no content', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';
        const ListItem = styled.div({
          ':after': {
            content: '',
          },
        });
      `);

      expect(actual).toInclude('.css-test:after{content:\\"\\"}');
    });

    it('should respect the definition of pseudo element content ala styled components with content', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';
        const ListItem = styled.div({
          ':after': {
            content: '😎',
          },
        });
      `);

      expect(actual).toInclude('.css-test:after{content:\\"\\uD83D\\uDE0E\\"}');
    });

    it('should append "px" on numeric literals if missing', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';
        const ListItem = styled.div({
          fontSize: 12,
        });
      `);

      expect(actual).toInclude('.css-test{font-size:12px}');
    });

    it('should reference property access expression', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';
        const color = { blue: 'red' };

        styled.div({
          background: color.blue,
        });
      `);

      expect(actual).toInclude('"--var-test-colorblue": color.blue');
    });

    it('should not pass down invalid html attributes to the node when property has a suffix', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';
        const ListItem = styled.div({
          fontSize: props => \`\${props.textSize}px\`,
        });
      `);

      expect(actual).toInclude('.css-test{font-size:var(--var-test-propstextsizepx)}');
      expect(actual).toInclude('textSize, ...props }');
      expect(actual).toInclude('"--var-test-propstextsizepx": `${textSize}px`');
    });

    it('should not pass down invalid html attributes to the node when property has a suffix when func in template literal', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';
        const ListItem = styled.div({
          fontSize: \`\${props => props.textSize}px\`,
        });
      `);

      expect(actual).toInclude('textSize, ...props }');
      expect(actual).toInclude('.css-test{font-size:var(--var-test-propstextsize)}');
      expect(actual).toInclude('"--var-test-propstextsize": textSize + "px"');
    });

    it('should persist suffix of dynamic property value into inline styles', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const fontSize = 20;

        const ListItem = styled.div({
          fontSize: \`\${props => props.fontSize}px\`,
        });
      `);

      expect(actual).toInclude('"--var-test-propsfontsize": props.fontSize + "px" }}');
      expect(actual).toInclude('.css-test{font-size:var(--var-test-propsfontsize)}');
    });

    it('should transform object with simple values', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const ListItem = styled.div({
          color: 'blue',
          margin: 0,
        });
      `);

      expect(actual).toInclude('.css-test{color:blue;margin:0}');
    });

    it('should transform object with nested object into a selector', () => {
      const actual = transformer.transform(`
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

    it('should reference identifier pointing to a call expression if it returns simple value', () => {
      const actual = transformer.transform(`
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

    it('should inline call if it returns simple value', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const em = (str: string) => str;

        const ListItem = styled.div({
          color: em('blue'),
        });
      `);

      expect(actual).toInclude('.css-test{color:var(--var-test-emblue)}');
      expect(actual).toInclude('"--var-test-emblue": em(\'blue\') }}');
    });

    it('should transform template object with string variable', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const color = 'blue';

        const ListItem = styled.div({
          color,
        });
      `);

      expect(actual).toInclude('.css-test{color:blue}');
    });

    it('should transform template object with prop reference', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const ListItem = styled.div({
          color: props => props.color,
        });
      `);

      expect(actual).toInclude('.css-test{color:var(--var-test-propscolor)}');
      expect(actual).toInclude('"--var-test-propscolor": props.color }}');
    });

    it('should transform object spread from variable', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const h100 = { fontSize: '12px' };

        const ListItem = styled.div({
          ...h100,
        });
      `);

      expect(actual).toInclude('.css-test{font-size:12px}');
    });

    it('should transform object spread from import', () => {
      const actual = transformer.addSource({
        path: '/tip.ts',
        contents: `export const h100 = { fontSize: '12px' };`,
      }).transform(`
        import { styled } from '@compiled/css-in-js';
        import { h100 } from './tip';

        const ListItem = styled.div({
          ...h100,
        });
      `);

      expect(actual).toInclude('.css-test{font-size:12px}');
    });

    it('should transform object with string variable', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const color = 'blue';

        const ListItem = styled.div({
          color: color,
        });
      `);

      expect(actual).toInclude('.css-test{color:blue}');
    });

    it('should transform object with string import', () => {
      const actual = transformer.addSource({
        path: '/colors.ts',
        contents: `export const color = 'blue';`,
      }).transform(`
        import { styled } from '@compiled/css-in-js';
        import { color } from './colors';

        const ListItem = styled.div({
          color,
        });
      `);

      expect(actual).toInclude('.css-test{color:blue}');
    });

    it('should transform object with obj variable', () => {
      const actual = transformer.transform(`
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

    it('should transform object with obj import', () => {
      const actual = transformer.addSource({
        contents: `export const hover = { color: 'red' };`,
        path: './mixins.tsx',
      }).transform(`
        import { styled } from '@compiled/css-in-js';
        import { hover } from './mixins';

        const ListItem = styled.div({
          fontSize: '20px',
          ':hover': hover,
        });
      `);

      expect(actual).toInclude('.css-test{font-size:20px}');
      expect(actual).toInclude('.css-test:hover{color:red}');
    });

    it.todo('should transform object with array variable');

    it.todo('should transform object with array import');

    it('should transform object with no argument arrow function variable', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const mixin = () => ({ color: 'red' });

        const ListItem = styled.div({
          ...mixin(),
        });
      `);

      expect(actual).toInclude('.css-test{color:red}');
    });

    it('should transform object with no argument arrow function import', () => {
      const actual = transformer.addSource({
        path: '/mixin.ts',
        contents: "export const mixin = () => ({ color: 'red' });",
      }).transform(`
        import { styled } from '@compiled/css-in-js';
        import { mixin } from './mixin';

        const ListItem = styled.div({
          ...mixin(),
        });
      `);

      expect(actual).toInclude('.css-test{color:red}');
    });

    it('should transform object with no argument function variable', () => {
      const actual = transformer.transform(`
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

    it('should transform object with no argument function import', () => {
      const actual = transformer.addSource({
        path: '/mixin.ts',
        contents: `
          export function mixin() {
            return { color: 'red' };
          }
        `,
      }).transform(`
        import { styled } from '@compiled/css-in-js';
        import { mixin } from './mixin';

        const ListItem = styled.div({
          ...mixin(),
        });
      `);

      expect(actual).toInclude('.css-test{color:red}');
    });

    it.todo('should transform object with argument function variable');

    it.todo('should transform object with argument function import');

    it.todo('should transform object with argument arrow function variable');

    it.todo('should transform object with argument arrow function import');
  });

  it('should transform template string literal with string variable', () => {
    const actual = transformer.transform(`
      import { styled } from '@compiled/css-in-js';

      const fontSize = '20px';

      const ListItem = styled.div\`
        font-size: \${fontSize};
      \`;
    `);

    expect(actual).toInclude('.css-test{font-size:20px}');
  });
});
