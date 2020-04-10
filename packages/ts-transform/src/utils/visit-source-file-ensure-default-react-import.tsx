import * as ts from 'typescript';
import * as log from './log';
import * as constants from '../constants';

const isReactImportFound = (sourceFile: ts.SourceFile) => {
  return sourceFile.statements.find(
    statement =>
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === constants.REACT_PACKAGE_NAME
  );
};

export const visitSourceFileEnsureDefaultReactImport = (
  sourceFile: ts.SourceFile,
  context: ts.TransformationContext
): ts.SourceFile => {
  if (!isReactImportFound(sourceFile)) {
    log.log('react import not found, adding one with default export');

    const newSourceFile = ts.updateSourceFileNode(sourceFile, [
      ts.createImportDeclaration(
        /* decorators */ undefined,
        /* modifiers */ undefined,
        ts.createImportClause(ts.createIdentifier(constants.REACT_DEFAULT_IMPORT), undefined),
        ts.createLiteral(constants.REACT_PACKAGE_NAME)
      ),
      ...sourceFile.statements,
    ]);

    return newSourceFile;
  }

  log.log('react import found');

  // There is a react import declaration somewhere.
  // Let's find it and ensure the default export "React" exists.

  const visitor = (node: ts.Node): ts.Node => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === constants.REACT_PACKAGE_NAME
    ) {
      log.log('ensuring react default export is defined');

      return ts.updateImportDeclaration(
        node,
        /* decorators */ undefined,
        /* modifiers */ undefined,
        ts.createImportClause(
          ts.createIdentifier(constants.REACT_DEFAULT_IMPORT),
          node.importClause && node.importClause.namedBindings
        ),
        node.moduleSpecifier
      );
    }

    return ts.visitEachChild(node, visitor, context);
  };

  return ts.visitNode(sourceFile, visitor);
};
