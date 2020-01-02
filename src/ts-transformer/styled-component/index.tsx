import * as ts from 'typescript';
import { visitObjectStyledComponent } from './visitors/visit-styled-component';
import { getIdentifierText, isPackageModuleImport } from '../utils/ast-node';
import { VariableDeclarations } from '../types';
import { collectDeclarationsFromNode } from '../utils/collect-declarations';

const STYLED_NAME = 'styled';

const isStyledImportFound = (sourceFile: ts.SourceFile): boolean => {
  return !!sourceFile.statements.find(statement => isPackageModuleImport(statement, STYLED_NAME));
};

const isObjectStyledComponent = (node: ts.Node): node is ts.CallExpression => {
  if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) {
    return false;
  }

  return getIdentifierText(node.expression.expression) === STYLED_NAME;
};

export default function styledComponentTransformer(
  program: ts.Program
): ts.TransformerFactory<ts.SourceFile> {
  const transformerFactory: ts.TransformerFactory<ts.SourceFile> = context => {
    return sourceFile => {
      if (!isStyledImportFound(sourceFile)) {
        return sourceFile;
      }

      const collectedDeclarations: VariableDeclarations = {};

      const visitor = (node: ts.Node): ts.Node => {
        collectDeclarationsFromNode(node, program, collectedDeclarations);

        if (isPackageModuleImport(node, STYLED_NAME)) {
          return ts.createEmptyStatement();
        }

        if (isObjectStyledComponent(node)) {
          return visitObjectStyledComponent(node, context, collectedDeclarations);
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(sourceFile, visitor);
    };
  };

  return transformerFactory;
}
