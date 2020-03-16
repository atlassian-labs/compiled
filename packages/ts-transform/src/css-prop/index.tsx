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

const JSX_PRAGMA = 'jsx';

const isJsxPragmaFoundWithOurJsxFunction = (sourceFile: ts.SourceFile) => {
  return (
    // __HACK_ALERT__!! This isn't in the TS types. Is this bad?
    (sourceFile as any).pragmas.get(JSX_PRAGMA) &&
    // Only continue if we've found an import for this pkg.
    sourceFile.statements.find(statement => {
      return isPackageModuleImport(statement, JSX_PRAGMA);
    })
  );
};

const resetJsxPragma = (sourceFile: ts.SourceFile) => {
  ((sourceFile as any).pragmas as Map<any, any>).clear();
  delete (sourceFile as any).localJsxFactory;
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

      resetJsxPragma(sourceFile);

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
          return ts.visitEachChild(newNode, visitor, context);
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(transformedSourceFile, visitor);
    };
  };

  return transformerFactory;
}
