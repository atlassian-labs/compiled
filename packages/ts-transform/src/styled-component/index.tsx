import * as ts from 'typescript';
import { visitStyledComponent } from './visitors/visit-styled-component';
import { getIdentifierText, isPackageModuleImport } from '../utils/ast-node';
import { Declarations } from '../types';
import { collectDeclarationsFromNode } from '../utils/collect-declarations';
import { visitSourceFileEnsureDefaultReactImport } from '../utils/visit-source-file-ensure-default-react-import';
import { visitSourceFileEnsureStyleImport } from '../utils/visit-source-file-ensure-style-import';
import { STYLED_COMPONENT_IMPORT } from '../constants';

const isStyledImportFound = (sourceFile: ts.SourceFile): boolean => {
  return !!sourceFile.statements.find(statement =>
    isPackageModuleImport(statement, STYLED_COMPONENT_IMPORT)
  );
};

const isStyledComponent = (
  node: ts.Node
): node is ts.CallExpression | ts.TaggedTemplateExpression => {
  if (
    ts.isCallExpression(node) &&
    (ts.isPropertyAccessExpression(node.expression) || ts.isCallExpression(node.expression)) &&
    getIdentifierText(node.expression.expression) === STYLED_COMPONENT_IMPORT
  ) {
    // styled.div() or styled(Component)()
    return true;
  }

  if (
    ts.isTaggedTemplateExpression(node) &&
    (ts.isPropertyAccessExpression(node.tag) || ts.isCallExpression(node.tag)) &&
    getIdentifierText(node.tag.expression) === STYLED_COMPONENT_IMPORT
  ) {
    // styled.div`` or styled(Component)``
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
        visitSourceFileEnsureStyleImport(sourceFile, context, {
          removeNamedImport: STYLED_COMPONENT_IMPORT,
        }),
        context
      );
      const collectedDeclarations: Declarations = {};

      const visitor = (node: ts.Node): ts.Node => {
        collectDeclarationsFromNode(node, program, collectedDeclarations);

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
