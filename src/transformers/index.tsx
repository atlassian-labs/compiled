import { TransformerFactory, SourceFile } from 'typescript';
import * as logger from './utils/log';
import removeJsxPragmaRuntimeTransformer from './remove-jsx-pragma-runtime';
import cssPropTransformer from './css-prop';
import styledComponentTransformer from './styled-component';
import classNamesTransformer from './class-names';

interface TransformerOptions {
  debug?: boolean;
}

export default function transformers(opts: TransformerOptions) {
  logger.setEnabled(!!opts.debug);
  logger.log(
    'typescript transformer has been enabled in debug mode, you will see logs in your console just like this one!'
  );

  const transformers: TransformerFactory<SourceFile>[] = [
    removeJsxPragmaRuntimeTransformer(),
    cssPropTransformer(),
    styledComponentTransformer(),
    classNamesTransformer(),
  ];
  return transformers;
}
