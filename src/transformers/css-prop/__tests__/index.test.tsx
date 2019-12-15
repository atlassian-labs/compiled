import * as ts from 'typescript';
import cssPropTransformer from '../index';
import pkg from '../../../../package.json';

jest.mock('../../utils/identifiers');

const printer = ts.createPrinter();

const transform = (source: string): string => {
  const transformer = cssPropTransformer();
  const sourceFile = ts.createSourceFile('index.tsx', source, ts.ScriptTarget.Latest);
  const actual = ts.transform(sourceFile, [transformer]).transformed[0];
  return printer.printFile(actual).toString();
};

describe('css prop transformer', () => {
  it('should replace css prop with class name', () => {
    const actual = transform(`
      /** @jsx jsx */
      import { jsx } from '${pkg.name}';

      <div css={{}}>hello world</div>
    `);

    expect(actual).toInclude('<div className="test-class">hello world</div>');
  });

  it('should add react default import if missing', () => {
    const actual = transform(`
      /** @jsx jsx */
      import { jsx } from '${pkg.name}';

      <div css={{}}>hello world</div>
    `);

    expect(actual).toInclude('import React from "react";');
  });

  it('should do nothing if react default import is already defined', () => {
    const actual = transform(`
      /** @jsx jsx */
      import React from 'react';
      import { jsx } from '${pkg.name}';

      <div css={{}}>hello world</div>
    `);

    expect(actual).toIncludeRepeated('import React from "react";', 1);
  });

  it('should add react default import if it only has named imports', () => {
    const actual = transform(`
      /** @jsx jsx */
      import { useState } from 'react';
      import { jsx } from '${pkg.name}';

      <div css={{}}>hello world</div>
    `);

    expect(actual).toIncludeRepeated('import React from "react";', 1);
    expect(actual).toIncludeRepeated('import { useState } from "react";', 1);
  });

  describe('css prop with string', () => {
    it('should transform string literal', () => {
      const actual = transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        <div css="font-size: 20px;">hello world</div>
    `);

      expect(actual).toInclude('<style>.test-class{font-size:20px;}</style>');
    });

    it('should transform no template string literal', () => {
      const actual = transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        <div css={\`font-size: 20px;\`}>hello world</div>
    `);

      expect(actual).toInclude('<style>.test-class{font-size:20px;}</style>');
    });

    it.todo('should transform template string literal with string variable');

    it.todo('should transform template string literal with string import');

    it.todo('should transform template string literal with obj variable');

    it.todo('should transform template string literal with obj import');

    it.todo('should transform template string literal with array variable');

    it.todo('should transform template string literal with array import');

    it.todo('should transform template string literal with function variable');

    it.todo('should transform template string literal with function import');
  });

  describe('css prop with object literal', () => {
    it('should transform object with simple values', () => {
      const actual = transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        <div css={{ fontSize: 20, color: 'blue' }}>hello world</div>
      `);

      expect(actual).toInclude('<style>.test-class{font-size:20;color:blue;}</style>');
    });

    it('should transform object with nested object into a selector', () => {
      const actual = transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        <div css={{ ':hover': { color: 'blue' } }}>hello world</div>
      `);

      expect(actual).toInclude('<style>.test-class:hover{color:blue;}</style>');
    });

    it.todo('should transform object with object selector from variable');

    it.todo('should transform object with object selector from import');

    it('should transform object with variable', () => {
      const actual = transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        const blue = 'blue';
        <div css={{ color: blue }}>hello world</div>
      `);

      expect(actual).toInclude(
        '<div className="test-class" style={{ "--color-test-css-variable": blue }}>hello world</div>'
      );
      expect(actual).toInclude('<style>.test-class{color:var(--color-test-css-variable);}</style>');
    });

    it('should transform object spread from variable', () => {
      const actual = transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';

        const mixin = { color: 'red' };
        <div css={{ color: 'blue', ...mixin }}>hello world</div>
      `);

      expect(actual).toInclude('<style>.test-class{color:blue;color:red;}</style>');
    });

    it.todo('should transform object spread from import');

    it.todo('should transform object with string variable');

    it.todo('should transform object with string import');

    it.todo('should transform object with obj variable');

    it.todo('should transform object with obj import');

    it.todo('should transform object with array variable');

    it.todo('should transform object with array import');

    it.todo('should transform object with function variable');

    it.todo('should transform object with function import');
  });
});
