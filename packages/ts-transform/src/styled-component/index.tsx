import * as ts from 'typescript';
import { visitStyledComponent } from './visitors/visit-styled-component';
import { getIdentifierText, isPackageModuleImport } from '../utils/ast-node';
import { Declarations } from '../types';
import { collectDeclarationsFromNode } from '../utils/collect-declarations';
import { visitSourceFileEnsureDefaultReactImport } from '../utils/visit-source-file-ensure-default-react-import';
import { visitSourceFileEnsureStyleImport } from '../utils/visit-source-file-ensure-style-import';

const STYLED_NAME = 'styled';

const isStyledImportFound = (sourceFile: ts.SourceFile): boolean => {
  return !!sourceFile.statements.find(statement => isPackageModuleImport(statement, STYLED_NAME));
};

const isStyledComponent = (
  node: ts.Node
): node is ts.CallExpression | ts.TaggedTemplateExpression => {
  if (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    getIdentifierText(node.expression.expression) === STYLED_NAME
  ) {
    return true;
  }

  if (
    ts.isTaggedTemplateExpression(node) &&
    ts.isPropertyAccessExpression(node.tag) &&
    getIdentifierText(node.tag.expression) === STYLED_NAME
  ) {
    return true;
  }

  return false;
};

export default function styledComponentTransformer(
  program: ts.Program
): ts.TransformerFactory<ts.SourceFile> {
  const transformerFactory: ts.TransformerFactory<ts.SourceFile> = context => {
    return sourceFile => {
      if (!isStyledImportFound(sourceFile)) {
        return sourceFile;
      }

      const transformedSourceFile = visitSourceFileEnsureDefaultReactImport(
        visitSourceFileEnsureStyleImport(sourceFile, context),
        context
      );
      const collectedDeclarations: Declarations = {};

      const visitor = (node: ts.Node): ts.Node => {
        collectDeclarationsFromNode(node, program, collectedDeclarations);

        // TODO: Remove STYLED_NAME import instead of removing entire thing.
        // if (isPackageModuleImport(node, STYLED_NAME)) {
        //   return ts.createEmptyStatement();
        // }

        if (isStyledComponent(node)) {
          return visitStyledComponent(node, context, collectedDeclarations);
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(transformedSourceFile, visitor);
    };
  };

  return transformerFactory;
}
