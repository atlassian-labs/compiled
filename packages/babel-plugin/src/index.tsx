import * as ts from 'typescript';
import { parse as babelParse, transformSync, ParserOptions } from '@babel/core';
import transformer from '@compiled/ts-transform-css-in-js';
import { TransformerOptions } from '@compiled/ts-transform-css-in-js/dist/types';

/**
 * Using a stub program means type checking won't work - of course.
 */
const stubProgam: ts.Program = ({
  getTypeChecker: () => ({
    getSymbolAtLocation: () => undefined,
  }),
} as never) as ts.Program;

export default function compiledBabelPlugin(_: any, opts: TransformerOptions = {}) {
  return {
    parserOverride(code: string, parserOpts: ParserOptions, parse: typeof babelParse) {
      const userLandFlowPlugin = (parserOpts.plugins || []).find((plugin) => {
        return plugin === 'flow' || plugin[0] === 'flow';
      });

      let parsedCode: string = code;

      if (userLandFlowPlugin) {
        // If the userland Babel config is Flow we need to strip it before passing it to the TypeScript
        // transformer else it'll blow up because TypeScript doesn't support Flow syntax.
        // We're going down a slippery slope - later we might want to investigate a re-write to Babel.
        // See: https://github.com/atlassian-labs/compiled-css-in-js/issues/196
        parsedCode =
          transformSync(parsedCode, {
            plugins: ['@babel/plugin-transform-flow-strip-types'],
          })?.code || parsedCode;
      }

      const transformedCode = ts.transpileModule(parsedCode, {
        transformers: { before: [transformer(stubProgam, { options: opts })] },
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
