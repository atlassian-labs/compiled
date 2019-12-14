import * as ts from 'typescript';
import cssPropTransformer from '../index';
import pkg from '../../../../package.json';

const printer = ts.createPrinter();

describe('css prop transformer', () => {
  it('should remove css prop from markup', () => {
    const transformer = cssPropTransformer();
    const source = `
/** @jsx jsx */
import { jsx } from '${pkg.name}';

<div css={{}}>hello world</div>
    `;
    const sourceFile = ts.createSourceFile('index.tsx', source, ts.ScriptTarget.Latest);

    const actual = ts.transform(sourceFile, [transformer]).transformed[0];

    expect(printer.printFile(actual).toString()).toInclude('<div className="a">hello world</div>');
  });

  it('should add react default import if missing', () => {
    const transformer = cssPropTransformer();
    const source = `
/** @jsx jsx */
import { jsx } from '${pkg.name}';

<div css={{}}>hello world</div>
    `;
    const sourceFile = ts.createSourceFile('index.tsx', source, ts.ScriptTarget.Latest);

    const actual = ts.transform(sourceFile, [transformer]).transformed[0];

    expect(printer.printFile(actual).toString()).toInclude('import React from "react";');
  });

  it('should do nothing if react default import is already defined', () => {
    const transformer = cssPropTransformer();
    const source = `
/** @jsx jsx */
import React from 'react';
import { jsx } from '${pkg.name}';

<div css={{}}>hello world</div>
    `;
    const sourceFile = ts.createSourceFile('index.tsx', source, ts.ScriptTarget.Latest);

    const actual = ts.transform(sourceFile, [transformer]).transformed[0];

    expect(printer.printFile(actual).toString()).toIncludeRepeated('import React from "react";', 1);
  });

  it('should add react default import if it only has named imports', () => {
    const transformer = cssPropTransformer();
    const source = `
/** @jsx jsx */
import { useState } from 'react';
import { jsx } from '${pkg.name}';

<div css={{}}>hello world</div>
    `;
    const sourceFile = ts.createSourceFile('index.tsx', source, ts.ScriptTarget.Latest);

    const actual = ts.transform(sourceFile, [transformer]).transformed[0];

    expect(printer.printFile(actual).toString()).toIncludeRepeated('import React from "react";', 1);
    expect(printer.printFile(actual).toString()).toIncludeRepeated(
      'import { useState } from "react";',
      1
    );
  });
});
