import * as ts from 'typescript';
import transformer from '../index';
import { TransformerOptions } from '../../types';

const stubProgram: ts.Program = ({
  getTypeChecker: () => ({
    getSymbolAtLocation: () => undefined,
  }),
} as never) as ts.Program;

const transpileModule = (source: string, opts: TransformerOptions = {}) => {
  return ts.transpileModule(source, {
    transformers: { before: [transformer(stubProgram, opts)] },
    compilerOptions: {
      module: ts.ModuleKind.ES2015,
      jsx: ts.JsxEmit.Preserve,
      target: ts.ScriptTarget.ESNext,
    },
  }).outputText;
};

describe('create theme provider', () => {
  xit('should do something', () => {
    const actual = transpileModule(`
      import { createThemeProvider } from '@compiled/css-in-js';

      createThemeProvider();
    `);

    expect(actual).toInclude('const theme = {');
  });
});
