import removePragmaRuntime from '../index';
import * as ts from 'typescript';
import * as fs from 'fs';

const printer = ts.createPrinter();

describe('removing jsx pragma runtime', () => {
  it('should set the compiled variable to true', () => {
    const transformer = removePragmaRuntime();
    const source = fs.readFileSync(`${__dirname}/../../../jsx/index.tsx`).toString();
    const sourceFile = ts.createSourceFile('index.tsx', source, ts.ScriptTarget.Latest);

    const actual = ts.transform(sourceFile, [transformer]).transformed[0];

    expect(printer.printFile(actual)).toInclude('const IS_CSS_FREEDOM_COMPILED: string = true;');
  });
});
