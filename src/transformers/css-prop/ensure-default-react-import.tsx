import * as ts from 'typescript';
import * as logger from '../utils/log';
import { getExpressionText } from '../utils/ast-node';

const REACT_PKG = 'react';
const REACT_DEFAULT_IMPORT_NAME = 'React';

const isDefaultReactImportFound = (sourceFile: ts.SourceFile) => {
  return sourceFile.statements.find(
    statement =>
      ts.isImportDeclaration(statement) &&
      statement.importClause &&
      statement.importClause.name &&
      statement.importClause.name.getText() === REACT_DEFAULT_IMPORT_NAME
  );
};

export const ensureDefaultReactImport = (sourceFile: ts.SourceFile): ts.SourceFile => {
  if (!isDefaultReactImportFound(sourceFile)) {
    logger.log('default import for react was not found - adding it');

    const newSourceFile = ts.updateSourceFileNode(sourceFile, [
      ts.createImportDeclaration(
        /* decorators */ undefined,
        /* modifiers */ undefined,
        ts.createImportClause(ts.createIdentifier(REACT_DEFAULT_IMPORT_NAME), undefined),
        ts.createLiteral(REACT_PKG)
      ),
      ...sourceFile.statements,
    ]);

    return newSourceFile;
  }

  return sourceFile;
};
