import * as ts from 'typescript';
import { isPackageModuleImport } from '../utils/ast-node';
import { visitCreateThemeProvider } from './visitors/visit-create-theme-provider';
import { visitSourceFileEnsureDefaultReactImport } from '../utils/visit-source-file-ensure-default-react-import';
import { visitSourceFileEnsureStyleImport } from '../utils/visit-source-file-ensure-style-import';
import {
  TOKENS_OBJECT_NAME,
  CREATE_THEME_PROVIDER_IMPORT,
  COMPILED_THEME_NAME,
} from '../constants';
import { TransformerOptions } from '../types';

const isStyledImportFound = (sourceFile: ts.SourceFile): boolean => {
  return !!sourceFile.statements.find(statement =>
    isPackageModuleImport(statement, CREATE_THEME_PROVIDER_IMPORT)
  );
};

const isCreateThemeProviderCall = (node: ts.Node): node is ts.CallExpression => {
  return (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === CREATE_THEME_PROVIDER_IMPORT
  );
};

export default function styledComponentTransformer(
  _: ts.Program,
  options: TransformerOptions = {}
): ts.TransformerFactory<ts.SourceFile> {
  const transformerFactory: ts.TransformerFactory<ts.SourceFile> = context => {
    return sourceFile => {
      if (!isStyledImportFound(sourceFile)) {
        return sourceFile;
      }

      if (!options.tokens) {
        throw new Error('define your tokens');
      }

      let tokensAdded = false;

      const transformedSourceFile = visitSourceFileEnsureDefaultReactImport(
        visitSourceFileEnsureStyleImport(sourceFile, context, {
          removeNamedImport: CREATE_THEME_PROVIDER_IMPORT,
          imports: [COMPILED_THEME_NAME],
        }),
        context
      );

      const visitor = (node: ts.Node): ts.Node | ts.Node[] => {
        if ((tokensAdded && ts.isVariableStatement(node)) || ts.isExpressionStatement(node)) {
          tokensAdded = true;
          return [
            ts.createVariableDeclarationList(
              [
                ts.createVariableDeclaration(
                  ts.createIdentifier(TOKENS_OBJECT_NAME),
                  undefined,
                  ts.createObjectLiteral([], false)
                ),
              ],
              ts.NodeFlags.Const
            ),
            ts.visitEachChild(node, visitor, context),
          ];
        }

        if (isCreateThemeProviderCall(node)) {
          return visitCreateThemeProvider(node, context, options);
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(transformedSourceFile, visitor);
    };
  };

  return transformerFactory;
}
