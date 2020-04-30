import * as ts from 'typescript';
import * as logger from './utils/log';
import cssPropTransformer from './css-prop';
import styledComponentTransformer from './styled-component';
import classNamesTransformer from './class-names';
import { TransformerOptions } from './types';

const transformers = [cssPropTransformer, styledComponentTransformer, classNamesTransformer];

export { TransformerOptions } from './types';

export default function transformer(
  program: ts.Program,
  args: { options?: TransformerOptions } = {}
): ts.TransformerFactory<ts.SourceFile> {
  args.options && logger.setEnabled(!!args.options.debug);

  return (context) => {
    const initializedTransformers = transformers.map((transformer) =>
      transformer(program, args.options || {})(context)
    );

    return (sourceFile) => {
      return initializedTransformers.reduce((source, transformer) => {
        return transformer(source);
      }, sourceFile);
    };
  };
}
