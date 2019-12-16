import * as ts from 'typescript';
import * as logger from './utils/log';
import removeJsxPragmaRuntimeTransformer from './remove-jsx-pragma-runtime';
import cssPropTransformer from './css-prop';
import styledComponentTransformer from './styled-component';
import classNamesTransformer from './class-names';

interface TransformerOptions {
  debug?: boolean;
}

export default function transformers(program: ts.Program, opts: TransformerOptions) {
  logger.setEnabled(!!opts.debug);
  logger.log(
    'typescript transformer has been enabled in debug mode, you will see logs in your console just like this one!'
  );

  const transformers: ts.TransformerFactory<ts.SourceFile>[] = [
    removeJsxPragmaRuntimeTransformer(program),
    cssPropTransformer(program),
    styledComponentTransformer(program),
    classNamesTransformer(program),
  ];
  return transformers;
}
