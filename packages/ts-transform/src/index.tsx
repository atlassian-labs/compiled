import * as ts from 'typescript';
import * as logger from './utils/log';
import cssPropTransformer from './css-prop';
import styledComponentTransformer from './styled-component';
import classNamesTransformer from './class-names';

interface TransformerOptions {
  debug?: boolean;
}

const transformers = [cssPropTransformer, styledComponentTransformer, classNamesTransformer];

export default function transformer(
  program: ts.Program,
  opts: TransformerOptions = {}
): ts.TransformerFactory<ts.SourceFile> {
  logger.setEnabled(!!opts.debug);

  return context => {
    const initializedTransformers = transformers.map(transformer => transformer(program)(context));

    return sourceFile => {
      return initializedTransformers.reduce((source, transformer) => {
        return transformer(source);
      }, sourceFile);
    };
  };
}
