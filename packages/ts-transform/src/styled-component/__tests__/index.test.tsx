import { Transformer } from 'ts-transformer-testing-library';
import styledComponentTransformer from '../index';

jest.mock('../../utils/identifiers');

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

    expect(actual).toInclude(
      'const ListItem = props => <><Style hash="test-class">{[".test-class{font-size:20px;}"]}</Style><div {...props} className={"test-class" + (props.className ? " " + props.className : "")}></div></>'
    );
  });

  it('should not pass down invalid html attributes to the node', () => {
    const actual = transformer.transform(`
      import { styled } from '@compiled/css-in-js';
      const ListItem = styled.div({
        fontSize: props => props.textSize,
      });
    `);

    expect(actual).toInclude('({ textSize, ...props }) =>');
    expect(actual).toInclude('"--var-1mnmsc": textSize');
  });

  xit('should compose using a previously created component', () => {
    const actual = transformer.transform(`
      import { styled } from '@compiled/css-in-js';

      const MyButton = ({ children, ...props }: any) => <button {...props}>{children}</button>

      const ListItem = styled(MyButton)({
        fontSize: '20px',
      });
    `);

    expect(actual).toInclude('<MyButton {...props} className');
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

    expect(actual).toInclude(
      'const ListItem = props => <><Style hash="test-class">{[".test-class{font-size:20px;}"]}</Style><div {...props} className={"test-class" + (props.className ? " " + props.className : "")}></div></>'
    );
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

    expect(actual).toInclude('<div {...props}');
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

  it('should concat class name prop if defined', () => {
    const actual = transformer.transform(`
      import { styled } from '@compiled/css-in-js';
      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude(
      `className={\"test-class\" + (props.className ? \" \" + props.className : \"\")}`
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

      expect(actual).toInclude('.test-class{font-size:12;}');
    });

    it('should not pass down invalid html attributes to the node when property has a suffix', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';
        const ListItem = styled.div\`
          font-size: \${props => props.textSize}px;
        \`;
      `);

      expect(actual).toInclude('.test-class{font-size:var(--var-1mnmsc);}');
      expect(actual).toInclude('({ textSize, ...props }) =>');
      expect(actual).toInclude('"--var-1mnmsc": textSize + "px"');
    });

    it('should persist suffix of dynamic property value into inline styles', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const fontSize = 20;

        const ListItem = styled.div\`
          font-size: \${fontSize}px;
        \`;
      `);

      expect(actual).toInclude(
        'style={{ ...props.style, "--fontSize-test-css-variable": fontSize + "px" }}'
      );
      expect(actual).toInclude('.test-class{font-size:var(--fontSize-test-css-variable);}');
    });

    it('should persist suffix of dynamic property value into inline styles when missing a semi colon', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const fontSize = 20;

        const ListItem = styled.div\`
          font-size: \${fontSize}px
        \`;
      `);

      expect(actual).toInclude('"--fontSize-test-css-variable": fontSize + "px" }}');
      expect(actual).toInclude('.test-class{font-size:var(--fontSize-test-css-variable);}');
    });

    it('should transform no template string literal', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const ListItem = styled.div\`
          font-size: 20px;
        \`;
      `);

      expect(actual).toInclude('.test-class{font-size:20px;}');
    });

    it('should transform template string literal with string variable', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const fontSize = '20px';

        const ListItem = styled.div\`
          font-size: \${fontSize};
        \`;
      `);

      expect(actual).toInclude('.test-class{font-size:var(--fontSize-test-css-variable);}');
    });

    it('should transform template string literal with numeric variable', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const margin = 0;

        const ListItem = styled.div\`
          margin: \${margin};
        \`;
      `);

      expect(actual).toInclude('.test-class{margin:var(--margin-test-css-variable);}');
    });

    it('should transform template string literal with prop reference', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const ListItem = styled.div\`
          color: \${props => props.color};
        \`;
      `);

      expect(actual).toInclude('.test-class{color:var(--var-kmurgp);}');
      expect(actual).toInclude('"--var-kmurgp": props.color }}');
    });

    it('should transform a arrow function with a body into an IIFE', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const ListItem = styled.div\`
          color: \${props => { return props.color; }};
        \`;
      `);

      expect(actual).toInclude('.test-class{color:var(--var-1bhsyr9);}');
      expect(actual).toInclude('"--var-1bhsyr9": (() => { return props.color; })() }}');
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

      expect(actual).toInclude('.test-class{font-size:var(--fontSize-test-css-variable);}');
    });

    it('should transform template string literal with obj variable', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const h200 = { fontSize: '12px' };

        const ListItem = styled.div\`
          font-size: \${h200};
        \`;
      `);

      expect(actual).toInclude('.test-class{font-size: font-size:12px;}');
    });

    it('should transform template string literal with obj import', () => {
      const actual = transformer.addSource({
        path: '/typo.ts',
        contents: `export const h200 = { fontSize: '12px' };`,
      }).transform(`
        import { styled } from '@compiled/css-in-js';
        import { h200 } from './typo';

        const ListItem = styled.div\`
          font-size: \${h200};
        \`;
      `);

      expect(actual).toInclude('.test-class{font-size: font-size:12px;}');
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

      expect(actual).toInclude('.test-class{color:var(--color-test-css-variable);}');
      expect(actual).toInclude('"--color-test-css-variable": color }}>');
    });

    it('should inline call if it returns simple value', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const em = (str: string) => str;

        const ListItem = styled.div\`
          color: \${em('blue')};
        \`;
      `);

      expect(actual).toInclude('.test-class{color:var(--em-test-css-variable);}');
      expect(actual).toInclude('"--em-test-css-variable": em(\'blue\') }}>');
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

      expect(actual).toInclude('.test-class{color:red;}');
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

      expect(actual).toInclude('.test-class{color:red;}');
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

      expect(actual).toInclude('.test-class{color:red;}');
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

      expect(actual).toInclude('.test-class{color:red;}');
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

      expect(actual).toInclude('.test-class:after{content:\\"\\";}');
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

      expect(actual).toInclude(".test-class:after{content:'';}");
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

      expect(actual).toInclude('.test-class:after{content:\\"\\";}');
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

      expect(actual).toInclude('.test-class:after{content:\\"\\uD83D\\uDE0E\\";}');
    });

    it('should append "px" on numeric literals if missing', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';
        const ListItem = styled.div({
          fontSize: 12,
        });
      `);

      expect(actual).toInclude('.test-class{font-size:12px;}');
    });

    it('should not pass down invalid html attributes to the node when property has a suffix', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';
        const ListItem = styled.div({
          fontSize: props => \`\${props.textSize}px\`,
        });
      `);

      expect(actual).toInclude('.test-class{font-size:var(--var-r807ho);}');
      expect(actual).toInclude('({ textSize, ...props }) =>');
      expect(actual).toInclude('"--var-r807ho": `${textSize}px`');
    });

    it('should not pass down invalid html attributes to the node when property has a suffix when func in template literal', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';
        const ListItem = styled.div({
          fontSize: \`\${props => props.textSize}px\`,
        });
      `);

      expect(actual).toInclude('.test-class{font-size:var(--var-1mnmsc);}');
      expect(actual).toInclude('({ textSize, ...props }) =>');
      expect(actual).toInclude('"--var-1mnmsc": textSize + "px"');
    });

    it('should persist suffix of dynamic property value into inline styles', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const fontSize = 20;

        const ListItem = styled.div({
          fontSize: \`\${props => props.fontSize}px\`,
        });
      `);

      expect(actual).toInclude('"--var-1dr62z0": props.fontSize + "px" }}');
      expect(actual).toInclude('.test-class{font-size:var(--var-1dr62z0);}');
    });

    it('should transform object with simple values', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const ListItem = styled.div({
          color: 'blue',
          margin: 0,
        });
      `);

      expect(actual).toInclude('.test-class{color:blue;margin:0;}');
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

      expect(actual).toInclude('.test-class:hover{color:blue;margin:0;}');
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

      expect(actual).toInclude('.test-class{color:var(--color-test-css-variable);}');
      expect(actual).toInclude('"--color-test-css-variable": color }}>');
    });

    it('should inline call if it returns simple value', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const em = (str: string) => str;

        const ListItem = styled.div({
          color: em('blue'),
        });
      `);

      expect(actual).toInclude('.test-class{color:var(--color-test-css-variable);}');
      expect(actual).toInclude('"--color-test-css-variable": em(\'blue\') }}>');
    });

    it('should transform template object with string variable', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const color = 'blue';

        const ListItem = styled.div({
          color,
        });
      `);

      expect(actual).toInclude('.test-class{color:var(--color-test-css-variable);}');
      expect(actual).toInclude('"--color-test-css-variable": color }}>');
    });

    it('should transform template object with prop reference', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const ListItem = styled.div({
          color: props => props.color,
        });
      `);

      expect(actual).toInclude('.test-class{color:var(--var-kmurgp);}');
      expect(actual).toInclude('"--var-kmurgp": props.color }}');
    });

    it('should transform object spread from variable', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const h100 = { fontSize: '12px' };

        const ListItem = styled.div({
          ...h100,
        });
      `);

      expect(actual).toInclude('.test-class{font-size:12px;}');
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

      expect(actual).toInclude('.test-class{font-size:12px;}');
    });

    it('should transform object with string variable', () => {
      const actual = transformer.transform(`
        import { styled } from '@compiled/css-in-js';

        const color = 'blue';

        const ListItem = styled.div({
          color: color,
        });
      `);

      expect(actual).toInclude('.test-class{color:var(--color-test-css-variable);}');
      expect(actual).toInclude('"--color-test-css-variable": color }}');
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

      expect(actual).toInclude('.test-class{color:var(--color-test-css-variable);}');
      expect(actual).toInclude('"--color-test-css-variable": color }}');
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

      expect(actual).toInclude('.test-class{font-size:20px;}');
      expect(actual).toInclude('.test-class:hover{color:red;}');
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

      expect(actual).toInclude('.test-class{font-size:20px;}');
      expect(actual).toInclude('.test-class:hover{color:red;}');
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

      expect(actual).toInclude('.test-class{color:red;}');
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

      expect(actual).toInclude('.test-class{color:red;}');
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

      expect(actual).toInclude('.test-class{color:red;}');
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

      expect(actual).toInclude('.test-class{color:red;}');
    });

    it.todo('should transform object with argument function variable');

    it.todo('should transform object with argument function import');

    it.todo('should transform object with argument arrow function variable');

    it.todo('should transform object with argument arrow function import');
  });
});
