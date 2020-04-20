import * as ts from 'typescript';
import * as constants from '../constants';

const isReactDefaultImport = (node: ts.Node): node is ts.ImportDeclaration => {
  return (
    ts.isImportDeclaration(node) &&
    ts.isStringLiteral(node.moduleSpecifier) &&
    node.moduleSpecifier.text === constants.REACT_PACKAGE_NAME &&
    !!node.importClause &&
    !!node.importClause.name &&
    node.importClause.name.text === constants.REACT_DEFAULT_IMPORT
  );
};

const isReactNamespaceImport = (node: ts.Node): node is ts.ImportDeclaration => {
  return (
    ts.isImportDeclaration(node) &&
    !!node.importClause &&
    !!node.importClause.namedBindings &&
    ts.isNamespaceImport(node.importClause.namedBindings) &&
    node.importClause.namedBindings.name.text === constants.REACT_DEFAULT_IMPORT
  );
};

const NAMESPACE_REACT_IMPORT = ts.createImportDeclaration(
  /* decorators */ undefined,
  /* modifiers */ undefined,
  ts.createImportClause(
    undefined,
    ts.createNamespaceImport(ts.createIdentifier(constants.REACT_DEFAULT_IMPORT))
  ),
  ts.createLiteral(constants.REACT_PACKAGE_NAME)
);

export const visitSourceFileEnsureDefaultReactImport = (
  sourceFile: ts.SourceFile,
  _: ts.TransformationContext
): ts.SourceFile => {
  let newSourceFile = sourceFile;
  const reactDefaultImport = sourceFile.statements.find(isReactDefaultImport);
  const reactNamespaceImport = sourceFile.statements.find(isReactNamespaceImport);

  if (!reactNamespaceImport) {
    // Namespace import wasn't found - add it!
    newSourceFile = ts.updateSourceFileNode(sourceFile, [
      NAMESPACE_REACT_IMPORT,
      ...newSourceFile.statements,
    ]);
  }

  if (reactDefaultImport) {
    if (
      reactDefaultImport.importClause &&
      reactDefaultImport.importClause.namedBindings &&
      ts.isNamedImports(reactDefaultImport.importClause.namedBindings) &&
      reactDefaultImport.importClause.namedBindings.elements.length
    ) {
      // Has named bindingings, keep them around but remove the default import.
      newSourceFile = ts.updateSourceFileNode(sourceFile, [
        ts.updateImportDeclaration(
          reactDefaultImport,
          /* decorators */ undefined,
          /* modifiers */ undefined,
          ts.createImportClause(undefined, reactDefaultImport.importClause.namedBindings),
          reactDefaultImport.moduleSpecifier
        ),
        ...newSourceFile.statements.filter(statement => !isReactDefaultImport(statement)),
      ]);
    } else {
      // Remove the import it's not needed anymore.
      newSourceFile = ts.updateSourceFileNode(
        sourceFile,
        newSourceFile.statements.filter(statement => !isReactDefaultImport(statement))
      );
    }
  }

  return newSourceFile;
};
