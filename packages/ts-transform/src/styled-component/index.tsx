import * as ts from 'typescript';
import { visitStyledComponent } from './visitors/visit-styled-component';
import { getIdentifierText, isPackageModuleImport } from '../utils/ast-node';
import { Declarations } from '../types';
import { collectDeclarationsFromNode } from '../utils/collect-declarations';
import { visitSourceFileEnsureDefaultReactImport } from '../utils/visit-source-file-ensure-default-react-import';
import { visitSourceFileEnsureStyleImport } from '../utils/visit-source-file-ensure-style-import';
import { STYLED_COMPONENT_IMPORT } from '../constants';
import { createDevDisplayName } from '../utils/create-jsx-element';
import { TransformerOptions } from '../types';

const isStyledImportFound = (sourceFile: ts.SourceFile): boolean => {
  return !!sourceFile.statements.find((statement) =>
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
  program: ts.Program,
  options: TransformerOptions = {}
): ts.TransformerFactory<ts.SourceFile> {
  const transformerFactory: ts.TransformerFactory<ts.SourceFile> = (context) => {
    return (sourceFile) => {
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

      const visitor = (node: ts.Node): ts.Node | ts.Node[] => {
        collectDeclarationsFromNode(node, program, collectedDeclarations);

        if (
          ts.isVariableStatement(node) &&
          // We are assuming there will be only one declaration.
          // This won't work if people chain them - let's improve this later if it comes up.
          node.declarationList.declarations[0].initializer &&
          isStyledComponent(node.declarationList.declarations[0].initializer) &&
          ts.isIdentifier(node.declarationList.declarations[0].name)
        ) {
          // We've found a styled component with a variable declaration
          // e.g. const StyledDiv = styled.div``.
          // Vist children first.
          const newNode = ts.visitEachChild(node, visitor, context);

          return [newNode, createDevDisplayName(node.declarationList.declarations[0].name)];
        }

        if (isStyledComponent(node)) {
          return visitStyledComponent(node, context, collectedDeclarations, options, sourceFile);
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(transformedSourceFile, visitor);
    };
  };

  return transformerFactory;
}
