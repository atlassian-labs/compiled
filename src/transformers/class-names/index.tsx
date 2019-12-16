import * as ts from 'typescript';

export default function classNamesTransformer(_: ts.Program): ts.TransformerFactory<ts.SourceFile> {
  const transformerFactory: ts.TransformerFactory<ts.SourceFile> = () => {
    return sourceFile => {
      return sourceFile;
    };
  };

  return transformerFactory;
}
