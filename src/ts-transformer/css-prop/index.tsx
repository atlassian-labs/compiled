import * as ts from 'typescript';
import * as logger from '../utils/log';
import { name as packageName } from '../../../package.json';
import { VariableDeclarations } from '../types';
import {
  isJsxElementWithCssProp,
  visitJsxElementWithCssProp,
} from './visitors/visit-jsx-element-with-css-prop';
import { visitSourceFileEnsureDefaultReactImport } from './visitors/visit-source-file-ensure-default-react-import';
import { getIdentifierText, getExpressionText, isPackageModuleImport } from '../utils/ast-node';

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

export default function cssPropTransformer(
  program: ts.Program
): ts.TransformerFactory<ts.SourceFile> {
  const transformerFactory: ts.TransformerFactory<ts.SourceFile> = context => {
    return sourceFile => {
      const foundVariableDeclarations: VariableDeclarations = {};
      let transformedSourceFile = sourceFile;
      let sourceFileNeedsToBeTransformed = false;

      if (isJsxPragmaFoundWithOurJsxFunction(sourceFile)) {
        logger.log(`found source file with ${packageName} usage`);
        sourceFileNeedsToBeTransformed = true;
        transformedSourceFile = visitSourceFileEnsureDefaultReactImport(sourceFile, context);
      } else {
        // nothing to do - return source file and nothing will be transformed.
        return sourceFile;
      }

      const visitor = (node: ts.Node): ts.Node => {
        if (!sourceFileNeedsToBeTransformed) {
          return node;
        }

        if (ts.isVariableDeclaration(node)) {
          // we may need this later, let's store it in a POJO for quick access.
          foundVariableDeclarations[getIdentifierText(node.name)] = node;
          return ts.visitEachChild(node, visitor, context);
        }

        if (ts.isImportDeclaration(node) && 'resolvedModules' in sourceFile) {
          // we may use these. store for later and if needed then resolve them.
          const moduleName = getExpressionText(node.moduleSpecifier);
          logger.log(`found a module "${moduleName}"`);
          // __HACK_ALERT__!! There isn't any other way to get the resolved module it seems.
          const resolvedModule: ts.SourceFile | undefined = (sourceFile as any).resolvedModules.get(
            moduleName
          );

          if (!resolvedModule) {
            logger.log(`module "${moduleName}" was not resolved`);
            return node;
          }

          // __HACK_ALERT__!! There isn't any other way to get the resolved file name it seems.
          const resolvedModuleFileName = (resolvedModule as any).resolvedFileName;
          const resolvedFileSource = program.getSourceFile(resolvedModuleFileName);
          if (!resolvedFileSource) {
            logger.log(`module source file for "${moduleName}" was not resolved`);
            return node;
          }

          const visitResolvedNode = (node: ts.Node): ts.Node => {
            if (ts.isVariableStatement(node) && node.modifiers && node.modifiers[0]) {
              // we may need this later, let's store it in a POJO for quick access.
              const variableDeclaration = node.declarationList.declarations[0];
              foundVariableDeclarations[getIdentifierText(variableDeclaration.name)] =
                node.declarationList.declarations[0];
              return node;
            }

            return ts.visitEachChild(node, visitResolvedNode, context);
          };

          logger.log(`visting "${moduleName}" to extract variable references`);
          ts.visitNode(resolvedFileSource, visitResolvedNode);
          logger.log(`finished visiting`);
        }

        if (isJsxElementWithCssProp(node)) {
          const newNode = visitJsxElementWithCssProp(node, foundVariableDeclarations, context);
          return ts.visitEachChild(newNode, visitor, context);
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(transformedSourceFile, visitor);
    };
  };

  return transformerFactory;
}
