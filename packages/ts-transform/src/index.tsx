import * as ts from 'typescript';
import path from 'path';
import cssPropTransformer from './css-prop';
import styledComponentTransformer from './styled-component';
import classNamesTransformer from './class-names';
import themeTransformer from './theme';
import { RootTransformerOptions, Tokens, TransformerOptions } from './types';

const transformers = [
  cssPropTransformer,
  styledComponentTransformer,
  classNamesTransformer,
  themeTransformer,
];

export { RootTransformerOptions as TransformerOptions } from './types';

const validateTokens = (_: Tokens) => {
  return _;
};

const getTokens = (tokens: RootTransformerOptions['tokens']) => {
  if (!tokens) {
    return undefined;
  }

  if (typeof tokens === 'string') {
    if (tokens.startsWith('./')) {
      // relative import
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const foundTokens = require(path.join(process.cwd(), tokens));
      return foundTokens;
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const foundTokens = require(require.resolve(tokens));
    return foundTokens;
  }

  return tokens;
};

export default function transformer(
  program: ts.Program,
  { options: rootOptions = {} }: { options?: RootTransformerOptions } = {}
): ts.TransformerFactory<ts.SourceFile> {
  const { tokens, ...opts } = rootOptions;
  const options: TransformerOptions = {
    ...opts,
    tokens: validateTokens(getTokens(tokens)),
  };

  return (context) => {
    const initializedTransformers = transformers.map((transformer) =>
      transformer(program, options)(context)
    );

    return (sourceFile) => {
      return initializedTransformers.reduce((source, transformer) => {
        return transformer(source);
      }, sourceFile);
    };
  };
}
