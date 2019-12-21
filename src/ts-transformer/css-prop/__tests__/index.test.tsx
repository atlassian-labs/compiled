import cssPropTransformer from '../index';
import pkg from '../../../../package.json';
import { createFullTransform } from '../../../__tests__/utils/transform';

jest.mock('../../utils/identifiers');

const fullTransform = createFullTransform(cssPropTransformer);

describe('css prop transformer', () => {
  it('should replace css prop with class name', async () => {
    const actual = await fullTransform(`
      /** @jsx jsx */
      import { jsx } from '${pkg.name}';

      <div css={{}}>hello world</div>
    `);

    expect(actual).toInclude('<div className="test-class">hello world</div>');
  });

  it('should add react default import if missing', async () => {
    const actual = await fullTransform(`
      /** @jsx jsx */
      import { jsx } from '${pkg.name}';

      <div css={{}}>hello world</div>
    `);

    expect(actual).toInclude('import React from "react";');
  });

  it('should do nothing if react default import is already defined', async () => {
    const actual = await fullTransform(`
      /** @jsx jsx */
      import React from 'react';
      import { jsx } from '${pkg.name}';

      <div css={{}}>hello world</div>
    `);

    expect(actual).toIncludeRepeated("import React from 'react';", 1);
  });

  it('should add react default import if it only has named imports', async () => {
    const actual = await fullTransform(`
      /** @jsx jsx */
      import { useState } from 'react';
      import { jsx } from '${pkg.name}';

      <div css={{}}>hello world</div>
    `);

    expect(actual).toIncludeRepeated('import React from "react";', 1);
    expect(actual).toIncludeRepeated("import { useState } from 'react';", 1);
  });

  it.todo('should concat explicit use of class name prop on an element');

  it.todo('should concat implicit use of class name prop where props are spread into an element');

  it.todo('should concat use of inline styles when there is use of dynamic css');

  describe('using strings', () => {
    it.only('should transform string literal', async () => {
      const actual = await fullTransform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        <div css="font-size: 20px;">hello world</div>
    `);

      expect(actual).toInclude('<style>.test-class{font-size:20px;}</style>');
    });

    it('should transform no template string literal', async () => {
      const actual = await fullTransform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        <div css={\`font-size: 20px;\`}>hello world</div>
    `);

      expect(actual).toInclude('<style>.test-class{font-size:20px;}</style>');
    });

    it('should transform template string literal with string variable', async () => {
      const actual = await fullTransform(`
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

    it('should transform template string literal with obj variable', async () => {
      const actual = await fullTransform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        const style = { color: 'blue', fontSize: '30px' };
        <div css={\`\${style}\`}>hello world</div>
      `);

      expect(actual).toInclude('<style>.test-class{color:blue;font-size:30px;}</style>');
    });

    it.todo('should transform template string literal with obj import');

    it.todo('should transform template string literal with array variable');

    it.todo('should transform template string literal with array import');

    it.todo('should transform template string with no argument arrow function variable');

    it.todo('should transform template string with no argument arrow function import');

    it.todo('should transform template string with no argument function variable');

    it.todo('should transform template string with no argument function import');

    it.todo('should transform template string with argument function variable');

    it.todo('should transform template string with argument function import');

    it.todo('should transform template string with argument arrow function variable');

    it.todo('should transform template string with argument arrow function import');
  });

  describe('using an object literal', () => {
    it('should transform object with simple values', async () => {
      const actual = await fullTransform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        <div css={{ fontSize: 20, color: 'blue' }}>hello world</div>
      `);

      expect(actual).toInclude('<style>.test-class{font-size:20;color:blue;}</style>');
    });

    it('should transform object with nested object into a selector', async () => {
      const actual = await fullTransform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        <div css={{ ':hover': { color: 'blue' } }}>hello world</div>
      `);

      expect(actual).toInclude('<style>.test-class:hover{color:blue;}</style>');
    });

    it('should transform object with object selector from variable', async () => {
      const actual = await fullTransform({
        index: `
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
        `,
        mixins: `
          export const mixin = { color: 'blue' };
        `,
      });

      expect(actual).toInclude(
        '<style>.test-class{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;font-size:50px;color:blue;}.test-class:hover{color:blue;}</style>'
      );
    });

    it.todo('should transform object with object selector from import');

    it('should transform object that has a variable reference', async () => {
      const actual = await fullTransform(`
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

    it('should transform object that has a destructured variable reference', async () => {
      const actual = await fullTransform(`
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

    it('should transform object spread from variable', async () => {
      const actual = await fullTransform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        const mixin = { color: 'red' };
        <div css={{ color: 'blue', ...mixin }}>hello world</div>
      `);

      expect(actual).toInclude('<style>.test-class{color:blue;color:red;}</style>');
    });

    it.todo('should transform object spread from import');

    it.todo('should transform object with string variable');

    it.todo('should transform object with string variable using shorthand notation');

    it.todo('should transform object with string import');

    it.todo('should transform object with obj variable');

    it.todo('should transform object with obj import');

    it.todo('should transform object with array variable');

    it.todo('should transform object with array import');

    it('should transform object with no argument arrow function variable', async () => {
      const actual = await fullTransform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        const mixin = () => ({ color: 'red' });

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

      expect(actual).toInclude('<style>.test-class{color:blue;color:red;}</style>');
    });

    it.todo('should transform object with no argument arrow function import');

    it.todo('should transform object with no argument function variable');

    it.todo('should transform object with no argument function import');

    it.todo('should transform object with argument function variable');

    it.todo('should transform object with argument function import');

    it.todo('should transform object with argument arrow function variable');

    it.todo('should transform object with argument arrow function import');
  });
});
