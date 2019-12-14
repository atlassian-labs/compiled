import { TransformerFactory, SourceFile } from 'typescript';
import * as logger from './utils/log';
import jsxPragmaTransformer from './remove-jsx-pragma-runtime';

interface TransformerOptions {
  debug?: boolean;
}

export default function transformers(opts: TransformerOptions) {
  logger.setEnabled(!!opts.debug);
  logger.log('typescript transformer has been enabled in debug mode');

  const transformers: TransformerFactory<SourceFile>[] = [jsxPragmaTransformer()];
  return transformers;
}
