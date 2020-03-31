import * as ts from 'typescript';
import { parse as babelParse, ParserOptions } from '@babel/core';
import transformer from '@compiled/ts-transform-css-in-js';

/**
 * Using a stub program means type checking won't work - of course.
 */
const stubProgam: ts.Program = ({
  getTypeChecker: () => ({
    getSymbolAtLocation: () => undefined,
  }),
} as never) as ts.Program;

export default function compiledBabelPlugin() {
  return {
    parserOverride(code: string, parserOpts: ParserOptions, parse: typeof babelParse) {
      const transformedCode = ts.transpileModule(code, {
        transformers: { before: [transformer(stubProgam)] },
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ESNext,
          jsx: ts.JsxEmit.Preserve,
        },
      });

      return parse(transformedCode.outputText, parserOpts);
    },
  };
}
