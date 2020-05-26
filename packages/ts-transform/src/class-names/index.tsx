import * as ts from 'typescript';
import { isPackageModuleImport, getIdentifierText } from '../utils/ast-node';
import { visitClassNamesJsxElement } from './visitors/visit-class-names-jsx-element';
import { collectDeclarationsFromNode } from '../utils/collect-declarations';
import { Declarations } from '../types';
import { visitSourceFileEnsureStyleImport } from '../utils/visit-source-file-ensure-style-import';
import { CLASS_NAMES_IMPORT } from '../constants';
import { TransformerOptions } from '../types';

const isClassNamesFound = (sourceFile: ts.SourceFile): boolean => {
  return !!sourceFile.statements.find((statement) =>
    isPackageModuleImport(statement, CLASS_NAMES_IMPORT)
  );
};

const isClassNameComponent = (node: ts.Node): node is ts.JsxElement => {
  return (
    ts.isJsxElement(node) && getIdentifierText(node.openingElement.tagName) === CLASS_NAMES_IMPORT
  );
};

export default function classNamesTransformer(
  program: ts.Program,
  options: TransformerOptions = {}
): ts.TransformerFactory<ts.SourceFile> {
  const transformerFactory: ts.TransformerFactory<ts.SourceFile> = (context) => {
    return (sourceFile) => {
      if (!isClassNamesFound(sourceFile)) {
        return sourceFile;
      }

      const transformedSourceFile = visitSourceFileEnsureStyleImport(sourceFile, context, {
        removeNamedImport: CLASS_NAMES_IMPORT,
      });
      const collectedDeclarations: Declarations = {};

      const visitor = (node: ts.Node): ts.Node => {
        collectDeclarationsFromNode(node, program, collectedDeclarations);

        if (isClassNameComponent(node)) {
          return visitClassNamesJsxElement(
            node,
            context,
            collectedDeclarations,
            options,
            sourceFile
          );
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(transformedSourceFile, visitor);
    };
  };

  return transformerFactory;
}
