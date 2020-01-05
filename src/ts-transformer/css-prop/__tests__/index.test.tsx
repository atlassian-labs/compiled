import { Transformer } from 'ts-transformer-testing-library';
import cssPropTransformer from '../index';
import pkg from '../../../../package.json';

jest.mock('../../utils/identifiers');

const transformer = new Transformer()
  .addTransformer(cssPropTransformer)
  .addMock({ name: pkg.name, content: `export const jsx: any = () => null` })
  .addMock({
    name: 'react',
    content: `export default {} as any; export const useState = {} as any;`,
  })
  .setFilePath('/index.tsx');

describe('css prop transformer', () => {
  it('should replace css prop with class name', () => {
    const actual = transformer.transform(`
      /** @jsx jsx */
      import { jsx } from '${pkg.name}';

      <div css={{}}>hello world</div>
    `);

    expect(actual).toInclude('<div className="test-class">hello world</div>');
  });

  it('should add react default import if missing', () => {
    const actual = transformer.transform(`
      /** @jsx jsx */
      import { jsx } from '${pkg.name}';

      <div css={{}}>hello world</div>
    `);

    expect(actual).toInclude('import React from "react";');
  });

  it('should do nothing if react default import is already defined', () => {
    const actual = transformer.transform(`
      /** @jsx jsx */
      import React from 'react';
      import { jsx } from '${pkg.name}';

      <div css={{}}>hello world</div>
    `);

    expect(actual).toIncludeRepeated(`import React from "react";`, 1);
  });

  it('should add react default import if it only has named imports', () => {
    const actual = transformer.transform(`
      /** @jsx jsx */
      import { useState } from 'react';
      import { jsx } from '${pkg.name}';

      <div css={{}}>hello world</div>
    `);

    expect(actual).toIncludeRepeated('import React, { useState } from "react"', 1);
  });

  it.todo('should concat explicit use of class name prop on an element');

  it.todo('should concat implicit use of class name prop where props are spread into an element');

  it.todo('should concat use of inline styles when there is use of dynamic css');

  describe('using strings', () => {
    it('should transform string literal', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        <div css="font-size: 20px;">hello world</div>
    `);

      expect(actual).toInclude('<style>.test-class{font-size:20px;}</style>');
    });

    it('should transform no template string literal', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        <div css={\`font-size: 20px;\`}>hello world</div>
    `);

      expect(actual).toInclude('<style>.test-class{font-size:20px;}</style>');
    });

    it('should transform template string literal with string variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        const color = 'blue';
        <div css={\`color: \${color};\`}>hello world</div>
      `);

      expect(actual).toInclude('<style>.test-class{color:var(--color-test-css-variable);}</style>');
      expect(actual).toInclude(
        '<div className="test-class" style={{ "--color-test-css-variable": color }}>hello world</div>'
      );
    });

    it('should transform template string literal with obj variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        const style = { color: 'blue', fontSize: '30px' };
        <div css={\`\${style}\`}>hello world</div>
      `);

      expect(actual).toInclude('<style>.test-class{color:blue;font-size:30px;}</style>');
    });

    it('should transform template string literal with obj import', () => {
      const actual = transformer.addSource({
        path: '/mixins.ts',
        contents: `export const style = { color: 'blue', fontSize: '30px' };`,
      }).transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';
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

      expect(actual).toInclude('<style>.test-class:last-child{color:blue;font-size:30px;}</style>');
    });

    it('should transform template string literal with obj import being used as a selector', () => {
      const actual = transformer.addSource({
        path: '/mixins.ts',
        contents: `export const style = { ':hover': { color: 'blue', fontSize: '30px' } };`,
      }).transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';
        import { style } from './mixins';

        <div css={\`\${style}\`}>hello world</div>
      `);

      expect(actual).toInclude('<style>.test-class:hover{color:blue;font-size:30px;}</style>');
    });

    it.todo('should transform template string literal with array variable');

    it.todo('should transform template string literal with array import');

    it('should transform template string with no argument arrow function variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        const style = () => ({ color: 'blue', fontSize: '30px' });
        <div css={\`\${style}\`}>hello world</div>
      `);

      expect(actual).toInclude('<style>.test-class{color:blue;font-size:30px;}</style>');
    });

    it('should transform template string with no argument arrow function call variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        const style = () => ({ color: 'blue', fontSize: '30px' });
        <div css={\`\${style()}\`}>hello world</div>
      `);

      expect(actual).toInclude('<style>.test-class{color:blue;font-size:30px;}</style>');
    });

    it('should transform template string with no argument arrow function call import', () => {
      const actual = transformer.addSource({
        path: '/stylez.ts',
        contents: `export const style = () => ({ color: 'blue', fontSize: '30px' });`,
      }).transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';
        import { style } from './stylez';

        <div css={\`\${style()}\`}>hello world</div>
      `);

      expect(actual).toInclude('<style>.test-class{color:blue;font-size:30px;}</style>');
    });

    it.todo('should transform template string with no argument function variable');

    it.todo('should transform template string with no argument function import');

    it.todo('should transform template string with argument function variable');

    it.todo('should transform template string with argument function import');

    xit('should transform template string with argument arrow function variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        const style = (color: string) => ({ color, fontSize: '30px' });
        const primary = 'red';
        <div css={\`\${style(primary)}\`}>hello world</div>
      `);

      expect(actual).toInclude(
        '<style>.test-class{color:var(--color-test-css-variable);font-size:30px;}</style>'
      );
      expect(actual).toInclude('style={{ "--color-test-css-variable": primary }}');
    });

    it.todo('should transform template string with argument arrow function import');
  });

  describe('using an object literal', () => {
    it('should transform object with simple values', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        <div css={{ fontSize: 20, color: 'blue' }}>hello world</div>
      `);

      expect(actual).toInclude('<style>.test-class{font-size:20;color:blue;}</style>');
    });

    it('should transform object with nested object into a selector', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        <div css={{ ':hover': { color: 'blue' } }}>hello world</div>
      `);

      expect(actual).toInclude('<style>.test-class:hover{color:blue;}</style>');
    });

    it('should transform object that has a variable reference', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        const blue: string = 'blue';
        <div css={{ color: blue }}>hello world</div>
      `);

      expect(actual).toInclude(
        '<div className="test-class" style={{ "--color-test-css-variable": blue }}>hello world</div>'
      );
      expect(actual).toInclude('<style>.test-class{color:var(--color-test-css-variable);}</style>');
    });

    it('should transform object that has a destructured variable reference', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { useState } from 'react';
        import { jsx } from '${pkg.name}';

        const [color, setColor] = useState('blue');
        <div css={{ color }}>hello world</div>
      `);

      expect(actual).toInclude(
        '<div className="test-class" style={{ "--color-test-css-variable": color }}>hello world</div>'
      );
      expect(actual).toInclude('<style>.test-class{color:var(--color-test-css-variable);}</style>');
    });

    it('should transform object spread from variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        const mixin = { color: 'red' };
        <div css={{ color: 'blue', ...mixin }}>hello world</div>
      `);

      expect(actual).toInclude('<style>.test-class{color:blue;color:red;}</style>');
    });

    it('should transform object spread from import', () => {
      const actual = transformer.addSource({
        path: '/mixins.ts',
        contents: `export const mixin = { color: 'red' };`,
      }).transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';
        import { mixin } from './mixins';

        <div css={{ color: 'blue', ...mixin }}>hello world</div>
      `);

      expect(actual).toInclude('<style>.test-class{color:blue;color:red;}</style>');
    });

    it('should transform object with string variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        const text = 'red';

        <div css={{ color: text }}>hello world</div>
      `);

      expect(actual).toInclude('<style>.test-class{color:var(--color-test-css-variable);}</style>');
      expect(actual).toInclude(
        '<div className="test-class" style={{ "--color-test-css-variable": text }}>'
      );
    });

    it('should transform object with string variable using shorthand notation', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        const color = 'red';

        <div css={{ color }}>hello world</div>
      `);

      expect(actual).toInclude('<style>.test-class{color:var(--color-test-css-variable);}</style>');
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
        import { jsx } from '${pkg.name}';
        import { color } from './colors';

        <div css={{ color }}>hello world</div>
      `);

      expect(actual).toInclude('<style>.test-class{color:var(--color-test-css-variable);}</style>');
      expect(actual).toInclude(
        '<div className="test-class" style={{ "--color-test-css-variable": color }}>'
      );
    });

    it('should transform object with obj variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

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
        '<style>.test-class{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;font-size:50px;color:blue;}.test-class:hover{color:blue;}</style>'
      );
    });

    it('should transform object with obj import', () => {
      const actual = transformer.addSource({
        path: '/mixins.ts',
        contents: "export const mixin = { color: 'blue' };",
      }).transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';
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
        '<style>.test-class{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;font-size:50px;color:blue;}.test-class:hover{color:blue;}</style>'
      );
    });

    it.todo('should transform object with array variable');

    it.todo('should transform object with array import');

    it('should transform object with no argument arrow function variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        const mixin = () => ({ color: 'red' });

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

      expect(actual).toInclude(`<style>.test-class{color:blue;color:red;}</style>`);
    });

    it('should transform object with no argument arrow function import', () => {
      const actual = transformer.addSource({
        path: '/mixins.ts',
        contents: `export const mixin = () => ({ color: 'red' });`,
      }).transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';
        import { mixin } from './mixins';

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

      expect(actual).toInclude(`<style>.test-class{color:blue;color:red;}</style>`);
    });

    it('should transform object spread with no argument arrow function variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        const mixin = () => ({ color: 'red' });

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

      expect(actual).toInclude('<style>.test-class{color:blue;color:red;}</style>');
    });

    it('should transform object spread with no argument arrow function import', () => {
      const actual = transformer.addSource({
        path: '/mixins.ts',
        contents: `export const mixin = () => ({ color: 'red' });`,
      }).transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';
        import { mixin } from './mixins';

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

      expect(actual).toInclude('<style>.test-class{color:blue;color:red;}</style>');
    });

    xit('should transform object with no argument function variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        function mixin() {
          return { color: 'red' };
        }

        <div css={{ color: 'blue', ':hover': mixin() }}>hello world</div>
      `);

      expect(actual).toInclude(
        `<style>.test-class{color:blue;}.test-class:hover{color:red;}</style>`
      );
    });

    xit('should transform object with no argument function import', () => {
      const actual = transformer.addSource({
        path: '/mixins.ts',
        contents: `
          export function mixin() {
            return { color: 'red' };
          }
        `,
      }).transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';
        import { mixin } from './mixins';

        <div css={{ color: 'blue', ':hover': mixin() }}>hello world</div>
      `);

      expect(actual).toInclude(
        `<style>.test-class{color:blue;}.test-class:hover{color:red;}</style>`
      );
    });

    xit('should transform object spread with no argument function variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        function mixin() {
          return { color: 'red' };
        }

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

      expect(actual).toInclude('<style>.test-class{color:blue;color:red;}</style>');
    });

    xit('should transform object spread with no argument function import', () => {
      const actual = transformer.addSource({
        path: '/mixins.ts',
        contents: `
          export function mixin() {
            return { color: 'red' };
          }
        `,
      }).transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';
        import { mixin } from './mixins';

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

      expect(actual).toInclude('<style>.test-class{color:blue;color:red;}</style>');
    });

    it.todo('should transform object with argument function variable');

    it.todo('should transform object with argument function import');

    it('should transform object with argument arrow function variable', () => {
      const actual = transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        const mixin = (color: string) => ({ color });
        const color = 'red';

        <div css={{ color: 'blue', ...mixin(color) }}>hello world</div>
      `);

      expect(actual).toInclude(
        '<style>.test-class{color:blue;color:var(--color-test-css-variable);}</style>'
      );
      expect(actual).toInclude('style={{ "--color-test-css-variable": color }}>');
    });

    it('should transform object with argument arrow function import', () => {
      const actual = transformer.addSource({
        path: '/styles.ts',
        contents: 'export const mixin = (color: string) => ({ color });',
      }).transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';
        import { mixin } from './styles';

        const color = 'red';

        <div css={{ color: 'blue', ...mixin(color) }}>hello world</div>
      `);

      expect(actual).toInclude(
        '<style>.test-class{color:blue;color:var(--color-test-css-variable);}</style>'
      );
      expect(actual).toInclude('style={{ "--color-test-css-variable": color }}>');
    });
  });
});
