import * as ts from 'typescript';
import * as log from './log';

const COMPILED_PKG = '@compiled/css-in-js';
const STYLE_IMPORT = 'Style';

export const visitSourceFileEnsureStyleImport = (
  sourceFile: ts.SourceFile,
  context: ts.TransformationContext
): ts.SourceFile => {
  const visitor = (node: ts.Node): ts.Node => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === COMPILED_PKG
    ) {
      log.log('ensuring style export is defined');

      const defaultImport = node.importClause && node.importClause.name;
      let namedImports: ts.ImportSpecifier[] = [];

      if (
        node.importClause &&
        node.importClause.namedBindings &&
        ts.isNamedImports(node.importClause.namedBindings)
      ) {
        namedImports = Array.from(node.importClause.namedBindings.elements);
      }

      return ts.updateImportDeclaration(
        node,
        /* decorators */ undefined,
        /* modifiers */ undefined,
        ts.createImportClause(
          defaultImport,
          ts.createNamedImports(
            [ts.createImportSpecifier(undefined, ts.createIdentifier(STYLE_IMPORT))].concat(
              namedImports
            )
          )
        ),
        node.moduleSpecifier
      );
    }

    return ts.visitEachChild(node, visitor, context);
  };

  return ts.visitNode(sourceFile, visitor);
};
