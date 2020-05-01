import * as ts from 'typescript';
import { isPackageModuleImport } from '../utils/ast-node';
import { visitSourceFileEnsureDefaultReactImport } from '../utils/visit-source-file-ensure-default-react-import';
import { visitSourceFileEnsureStyleImport } from '../utils/visit-source-file-ensure-style-import';
import { CREATE_THEME_PROVIDER_IMPORT, COMPILED_THEME_NAME } from '../constants';
import { TransformerOptions } from '../types';

const isStyledImportFound = (sourceFile: ts.SourceFile): boolean => {
  return !!sourceFile.statements.find(statement =>
    isPackageModuleImport(statement, CREATE_THEME_PROVIDER_IMPORT)
  );
};

export default function styledComponentTransformer(
  _: ts.Program,
  __: TransformerOptions = {}
): ts.TransformerFactory<ts.SourceFile> {
  const transformerFactory: ts.TransformerFactory<ts.SourceFile> = context => {
    return sourceFile => {
      if (!isStyledImportFound(sourceFile)) {
        return sourceFile;
      }

      const transformedSourceFile = visitSourceFileEnsureDefaultReactImport(
        visitSourceFileEnsureStyleImport(sourceFile, context, {
          removeNamedImport: CREATE_THEME_PROVIDER_IMPORT,
          imports: [COMPILED_THEME_NAME],
        }),
        context
      );

      const visitor = (node: ts.Node): ts.Node | ts.Node[] => {
        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(transformedSourceFile, visitor);
    };
  };

  return transformerFactory;
}
