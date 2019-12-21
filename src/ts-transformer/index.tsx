import * as ts from 'typescript';
import * as logger from './utils/log';
import removeJsxPragmaRuntimeTransformer from './remove-jsx-pragma-runtime';
import cssPropTransformer from './css-prop';
import styledComponentTransformer from './styled-component';
import classNamesTransformer from './class-names';

interface TransformerOptions {
  debug?: boolean;
}

export const rawTransformers = [
  removeJsxPragmaRuntimeTransformer,
  cssPropTransformer,
  styledComponentTransformer,
  classNamesTransformer,
];

export default function transformers(program: ts.Program, opts: TransformerOptions) {
  logger.setEnabled(!!opts.debug);
  logger.log(
    'typescript transformer has been enabled in debug mode, you will see logs in your console just like this one!'
  );

  const transformers: ts.TransformerFactory<ts.SourceFile>[] = rawTransformers.map(transformer =>
    transformer(program)
  );
  return transformers;
}
