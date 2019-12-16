import * as ts from 'typescript';

export default function classNamesTransformer() {
  const transformerFactory: ts.TransformerFactory<ts.SourceFile> = () => {
    return sourceFile => {
      return sourceFile;
    };
  };

  return transformerFactory;
}
