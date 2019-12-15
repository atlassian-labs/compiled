import * as ts from 'typescript';

export default function styledComponentTransformer() {
  const transformerFactory: ts.TransformerFactory<ts.SourceFile> = () => {
    return sourceFile => {
      return sourceFile;
    };
  };

  return transformerFactory;
}
