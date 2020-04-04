import * as ts from 'typescript';
import * as logger from '../utils/log';
import { Declarations } from '../types';
import {
  isJsxElementWithCssProp,
  visitJsxElementWithCssProp,
} from './visitors/visit-jsx-element-with-css-prop';
import { visitSourceFileEnsureDefaultReactImport } from '../utils/visit-source-file-ensure-default-react-import';
import { visitSourceFileEnsureStyleImport } from '../utils/visit-source-file-ensure-style-import';
import { isPackageModuleImport } from '../utils/ast-node';
import { collectDeclarationsFromNode } from '../utils/collect-declarations';

const isJsxPragmaFoundWithOurJsxFunction = (sourceFile: ts.SourceFile) => {
  return (
    // Only continue if we've found an import for this pkg.
    sourceFile.statements.find(statement => {
      return isPackageModuleImport(statement);
    })
  );
};

export default function cssPropTransformer(
  program: ts.Program
): ts.TransformerFactory<ts.SourceFile> {
  const transformerFactory: ts.TransformerFactory<ts.SourceFile> = context => {
    return sourceFile => {
      if (!isJsxPragmaFoundWithOurJsxFunction(sourceFile)) {
        // nothing to do - return source file and nothing will be transformed.
        return sourceFile;
      }

      const collectedDeclarations: Declarations = {};
      logger.log('found file with jsx pragma');
      const transformedSourceFile = visitSourceFileEnsureDefaultReactImport(
        visitSourceFileEnsureStyleImport(sourceFile, context),
        context
      );

      const visitor = (node: ts.Node): ts.Node => {
        collectDeclarationsFromNode(node, program, collectedDeclarations);

        if (isJsxElementWithCssProp(node)) {
          const newNode = visitJsxElementWithCssProp(node, collectedDeclarations, context);

          if (ts.isJsxSelfClosingElement(node)) {
            // It was self closing - it can't have children!
            return newNode;
          }

          return ts.visitEachChild(newNode, visitor, context);
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(transformedSourceFile, visitor);
    };
  };

  return transformerFactory;
}
