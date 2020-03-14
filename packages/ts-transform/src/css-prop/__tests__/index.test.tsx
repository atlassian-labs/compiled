import { Transformer } from 'ts-transformer-testing-library';
import 'jest-extended';
import cssPropTransformer from '../index';

jest.mock('../../utils/identifiers');

const transformer = new Transformer()
  .addTransformer(cssPropTransformer)
  .addMock({ name: '@compiled/css-in-js', content: `export const jsx: any = () => null` })
  .addMock({
    name: 'react',
    content: `export default {} as any; export const useState = {} as any;`,
  })
  .setFilePath('/index.tsx');

describe('css prop transformer', () => {
  it('should replace css prop with class name', () => {
    const actual = transformer.transform(`
      /** @jsx jsx */
      import { jsx } from '@compiled/css-in-js';

      <div css={{}}>hello world</div>
    `);

    expect(actual).toInclude('<div className="test-class">hello world</div>');
  });

  it('should add react default import if missing', () => {
    const actual = transformer.transform(`
      /** @jsx jsx */
      import { jsx } from '@compiled/css-in-js';

      <div css={{}}>hello world</div>
    `);

    expect(actual).toInclude(`import React from \"react\";`);
  });

  it('should ensure Style has been imported', () => {
    const actual = transformer.transform(`
      /** @jsx jsx */
      import React from 'react';
      import { jsx } from '@compiled/css-in-js';

      <div css={{}}>hello world</div>
    `);

    expect(actual).toIncludeRepeated(`import { Style, jsx } from '@compiled/css-in-js';`, 1);
  });

  it('should do nothing if react default import is already defined', () => {
    const actual = transformer.transform(`
      /** @jsx jsx */
      import React from 'react';
      import { jsx } from '@compiled/css-in-js';

      <div css={{}}>hello world</div>
    `);

    expect(actual).toIncludeRepeated(`import React from 'react';`, 1);
  });

  it('should add react default import if it only has named imports', () => {
    const actual = transformer.transform(`
      /** @jsx jsx */
      import { useState } from 'react';
      import { jsx } from '@compiled/css-in-js';

      <div css={{}}>hello world</div>
    `);

    expect(actual).toIncludeRepeated("import React, { useState } from 'react'", 1);
  });

  it('should concat explicit use of class name prop on an element', () => {
    const actual = transformer.transform(`
      /** @jsx jsx */
      import { jsx } from '@compiled/css-in-js';

      <div className="foobar" css={{}}>hello world</div>
    `);

    expect(actual).toInclude('className={"test-class" + " " + "foobar"}');
  });

  it.todo('should concat implicit use of class name prop where props are spread into an element');

  it('should concat implicit use of class name prop where class name is a jsx expression', () => {
    const actual = transformer.transform(`
      /** @jsx jsx */
      import { jsx } from '@compiled/css-in-js';

      const getFoo = () => 'foobar';

      <div css={{}} className={getFoo()}>hello world</div>
    `);

    expect(actual).toInclude('className={"test-class" + " " + getFoo()}');
  });

  it('should concat use of inline styles when there is use of dynamic css', () => {
    const actual = transformer.transform(`
      /** @jsx jsx */
      import { jsx } from '@compiled/css-in-js';

      const color = 'blue';

      <div css={{ color: color }} style={{ display: "block" }}>hello world</div>
    `);

    expect(actual).toInclude('style={{ display: "block", "--color-test-css-variable": color }}');
  });

  it.todo('should concat implicit use of style prop where props are spread into an element');

  describe('using strings', () => {
    it('should persist suffix of dynamic property value into inline styles', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';

        const fontSize = 20;

        <div css={\`font-size: \${fontSize}px;\`}>hello world</div>
      `);

      expect(actual).toInclude('style={{ "--fontSize-test-css-variable": fontSize + "px" }}');
      expect(actual).toInclude('.test-class{font-size:var(--fontSize-test-css-variable);}');
    });

    it('should transform string literal', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';

        <div css="font-size: 20px;">hello world</div>
    `);

      expect(actual).toInclude('.test-class{font-size:20px;}');
    });

    it('should transform no template string literal', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';

        <div css={\`font-size: 20px;\`}>hello world</div>
    `);

      expect(actual).toInclude('.test-class{font-size:20px;}');
    });

    it('should transform template string literal with string variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';

        const color = 'blue';
        <div css={\`color: \${color};\`}>hello world</div>
      `);

      expect(actual).toInclude('.test-class{color:var(--color-test-css-variable);}');
      expect(actual).toInclude(
        '<div className="test-class" style={{ "--color-test-css-variable": color }}>hello world</div>'
      );
    });

    it('should transform template string literal with obj variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';

        const style = { color: 'blue', fontSize: '30px' };
        <div css={\`\${style}\`}>hello world</div>
      `);

      expect(actual).toInclude('.test-class{color:blue;font-size:30px;}');
    });

    it('should transform template string literal with obj import', () => {
      const actual = transformer.addSource({
        path: '/mixins.ts',
        contents: `export const style = { color: 'blue', fontSize: '30px' };`,
      }).transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';
        import { style } from './mixins';

        <div
          css={\`
            :last-child {
              \${style};
            }
          \`}
          >
          hello world
        </div>
      `);

      expect(actual).toInclude('.test-class:last-child{color:blue;font-size:30px;}');
    });

    it('should transform template string literal with obj import being used as a selector', () => {
      const actual = transformer.addSource({
        path: '/mixins.ts',
        contents: `export const style = { ':hover': { color: 'blue', fontSize: '30px' } };`,
      }).transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';
        import { style } from './mixins';

        <div css={\`\${style}\`}>hello world</div>
      `);

      expect(actual).toInclude('.test-class:hover{color:blue;font-size:30px;}');
    });

    it.todo('should transform template string literal with array variable');

    it.todo('should transform template string literal with array import');

    it('should transform template string with no argument arrow function variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';

        const style = () => ({ color: 'blue', fontSize: '30px' });
        <div css={\`\${style}\`}>hello world</div>
      `);

      expect(actual).toInclude('.test-class{color:blue;font-size:30px;}');
    });

    it('should transform template string with no argument arrow function call variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';

        const style = () => ({ color: 'blue', fontSize: '30px' });
        <div css={\`\${style()}\`}>hello world</div>
      `);

      expect(actual).toInclude('.test-class{color:blue;font-size:30px;}');
    });

    it('should transform template string with no argument arrow function call import', () => {
      const actual = transformer.addSource({
        path: '/stylez.ts',
        contents: `export const style = () => ({ color: 'blue', fontSize: '30px' });`,
      }).transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';
        import { style } from './stylez';

        <div css={\`\${style()}\`}>hello world</div>
      `);

      expect(actual).toInclude('.test-class{color:blue;font-size:30px;}');
    });

    it('should transform template string with no argument function variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';

        function mixin() {
          return { color: 'red' };
        }

        <div css={\`\${mixin()}\`}>hello world</div>
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
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';
        import { mixin } from './func-mixin';

        <div css={\`\${mixin()}\`}>hello world</div>
      `);

      expect(actual).toInclude('.test-class{color:red;}');
    });

    it.todo('should transform template string with argument function variable');

    it.todo('should transform template string with argument function import');

    xit('should transform template string with argument arrow function variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';

        const style = (color: string) => ({ color, fontSize: '30px' });
        const primary = 'red';
        <div css={\`\${style(primary)}\`}>hello world</div>
      `);

      expect(actual).toInclude('.test-class{color:var(--color-test-css-variable);font-size:30px;}');
      expect(actual).toInclude('style={{ "--color-test-css-variable": primary }}');
    });

    xit('should transform template string with argument arrow function import', () => {
      const actual = transformer.addSource({
        path: '/mixy-in.ts',
        contents: `export const style = (color: string) => ({ color, fontSize: '30px' });`,
      }).transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';
        import { style } from './mixy-in';

        const primary = 'red';
        <div css={\`\${style(primary)}\`}>hello world</div>
      `);

      expect(actual).toInclude('.test-class{color:var(--color-test-css-variable);font-size:30px;}');
      expect(actual).toInclude('style={{ "--color-test-css-variable": primary }}');
    });
  });

  describe('using an object literal', () => {
    it('should persist suffix of dynamic property value into inline styles', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';

        const fontSize = 20;

        <div css={{ fontSize: \`\${fontSize}px\` }}>hello world</div>
      `);

      expect(actual).toInclude('style={{ "--fontSize-test-css-variable": fontSize + "px" }}');
      expect(actual).toInclude('.test-class{font-size:var(--fontSize-test-css-variable);}');
    });

    it('should transform object with simple values', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';

        <div css={{ lineHeight: 20, color: 'blue' }}>hello world</div>
      `);

      expect(actual).toInclude('.test-class{line-height:20;color:blue;}');
    });

    it('should move right hand value (px, em, etc) after variable into style attribute', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';

        const fontSize = 12;

        <div css={{ fontSize: \`\${fontSize}px\` }}>hello world</div>
      `);

      expect(actual).toInclude('.test-class{font-size:var(--fontSize-test-css-variable);}');
      expect(actual).toInclude('style={{ "--fontSize-test-css-variable": fontSize + "px" }}');
    });

    it('should transform object with nested object into a selector', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';

        <div css={{ ':hover': { color: 'blue' } }}>hello world</div>
      `);

      expect(actual).toInclude('.test-class:hover{color:blue;}');
    });

    it('should transform object that has a variable reference', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';

        const blue: string = 'blue';
        <div css={{ color: blue }}>hello world</div>
      `);

      expect(actual).toInclude('style={{ "--color-test-css-variable": blue }}');
      expect(actual).toInclude('.test-class{color:var(--color-test-css-variable);}');
    });

    it('should transform object that has a destructured variable reference', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { useState } from 'react';
        import { jsx } from '@compiled/css-in-js';

        const [color, setColor] = useState('blue');
        <div css={{ color }}>hello world</div>
      `);

      expect(actual).toInclude(
        '<div className="test-class" style={{ "--color-test-css-variable": color }}>hello world</div>'
      );
      expect(actual).toInclude('.test-class{color:var(--color-test-css-variable);}');
    });

    it('should transform object spread from variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';

        const mixin = { color: 'red' };
        <div css={{ color: 'blue', ...mixin }}>hello world</div>
      `);

      expect(actual).toInclude('.test-class{color:blue;color:red;}');
    });

    it('should transform object spread from import', () => {
      const actual = transformer.addSource({
        path: '/mixins.ts',
        contents: `export const mixin = { color: 'red' };`,
      }).transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';
        import { mixin } from './mixins';

        <div css={{ color: 'blue', ...mixin }}>hello world</div>
      `);

      expect(actual).toInclude('.test-class{color:blue;color:red;}');
    });

    it('should transform object with string variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';

        const text = 'red';

        <div css={{ color: text }}>hello world</div>
      `);

      expect(actual).toInclude('.test-class{color:var(--color-test-css-variable);}');
      expect(actual).toInclude(
        '<div className="test-class" style={{ "--color-test-css-variable": text }}>'
      );
    });

    it('should transform object with string variable using shorthand notation', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';

        const color = 'red';

        <div css={{ color }}>hello world</div>
      `);

      expect(actual).toInclude('.test-class{color:var(--color-test-css-variable);}');
      expect(actual).toInclude(
        '<div className="test-class" style={{ "--color-test-css-variable": color }}>'
      );
    });

    it('should transform object with string import', () => {
      const actual = transformer.addSource({
        path: '/colors.tsx',
        contents: `export const color = 'red';`,
      }).transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';
        import { color } from './colors';

        <div css={{ color }}>hello world</div>
      `);

      expect(actual).toInclude('.test-class{color:var(--color-test-css-variable);}');
      expect(actual).toInclude(
        '<div className="test-class" style={{ "--color-test-css-variable": color }}>'
      );
    });

    it('should transform object with obj variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';

        const mixin = { color: 'blue' };

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

      expect(actual).toInclude(
        '.test-class{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;font-size:50px;color:blue;}.test-class:hover{color:blue;}'
      );
    });

    it('should transform object with obj import', () => {
      const actual = transformer.addSource({
        path: '/mixins.ts',
        contents: "export const mixin = { color: 'blue' };",
      }).transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';
        import { mixin } from './mixins';

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

      expect(actual).toInclude(
        '.test-class{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;font-size:50px;color:blue;}.test-class:hover{color:blue;}'
      );
    });

    it.todo('should transform object with array variable');

    it.todo('should transform object with array import');

    it('should transform object with no argument arrow function variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';

        const mixin = () => ({ color: 'red' });

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

      expect(actual).toInclude(`.test-class{color:blue;color:red;}`);
    });

    it('should transform object with no argument arrow function import', () => {
      const actual = transformer.addSource({
        path: '/mixins.ts',
        contents: `export const mixin = () => ({ color: 'red' });`,
      }).transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';
        import { mixin } from './mixins';

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

      expect(actual).toInclude(`.test-class{color:blue;color:red;}`);
    });

    it('should transform object spread with no argument arrow function variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';

        const mixin = () => ({ color: 'red' });

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

      expect(actual).toInclude('.test-class{color:blue;color:red;}');
    });

    it('should transform object spread with no argument arrow function import', () => {
      const actual = transformer.addSource({
        path: '/mixins.ts',
        contents: `export const mixin = () => ({ color: 'red' });`,
      }).transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';
        import { mixin } from './mixins';

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

      expect(actual).toInclude('.test-class{color:blue;color:red;}');
    });

    it('should transform object spread with no argument function variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';

        function mixin() {
          return { color: 'red' };
        }

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

      expect(actual).toInclude(`.test-class{color:blue;color:red;}`);
    });

    it('should transform object with no argument arrow function', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';

        const mixin = () => ({ color: 'red' });

        <div css={{ color: 'blue', ':hover': mixin() }}>hello world</div>
      `);

      expect(actual).toInclude(`.test-class{color:blue;}.test-class:hover{color:red;}`);
    });

    it('should transform object with no argument function variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';

        function mixin() {
          return { color: 'red' };
        }

        <div css={{ color: 'blue', ':hover': mixin() }}>hello world</div>
      `);

      expect(actual).toInclude(`.test-class{color:blue;}.test-class:hover{color:red;}`);
    });

    it('should transform object with no argument function import', () => {
      const actual = transformer.addSource({
        path: '/mixins.ts',
        contents: `
          export function mixin() {
            return { color: 'red' };
          }
        `,
      }).transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';
        import { mixin } from './mixins';

        <div css={{ color: 'blue', ':hover': mixin() }}>hello world</div>
      `);

      expect(actual).toInclude(`.test-class{color:blue;}.test-class:hover{color:red;}`);
    });

    it('should transform object spread with no argument function variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';

        function mixin() {
          return { color: 'red' };
        }

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

      expect(actual).toInclude('.test-class{color:blue;color:red;}');
    });

    it('should transform object spread with no argument function import', () => {
      const actual = transformer.addSource({
        path: '/mixins.ts',
        contents: `
          export function mixin() {
            return { color: 'red' };
          }
        `,
      }).transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';
        import { mixin } from './mixins';

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

      expect(actual).toInclude('.test-class{color:blue;color:red;}');
    });

    it.todo('should transform object with argument function variable');

    it.todo('should transform object with argument function import');

    it('should transform object with argument arrow function variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';

        const mixin = (color: string) => ({ color });
        const color = 'red';

        <div css={{ color: 'blue', ...mixin(color) }}>hello world</div>
      `);

      expect(actual).toInclude('.test-class{color:blue;color:var(--color-test-css-variable);}');
      expect(actual).toInclude('style={{ "--color-test-css-variable": color }}>');
    });

    it('should transform object with argument arrow function import', () => {
      const actual = transformer.addSource({
        path: '/styles.ts',
        contents: 'export const mixin = (color: string) => ({ color });',
      }).transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';
        import { mixin } from './styles';

        const color = 'red';

        <div css={{ color: 'blue', ...mixin(color) }}>hello world</div>
      `);

      expect(actual).toInclude('.test-class{color:blue;color:var(--color-test-css-variable);}');
      expect(actual).toInclude('style={{ "--color-test-css-variable": color }}>');
    });
  });
});
