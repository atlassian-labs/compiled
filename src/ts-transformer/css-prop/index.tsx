import * as ts from 'typescript';
import * as logger from '../utils/log';
import { name as packageName } from '../../../package.json';
import { VariableDeclarations } from '../types';
import {
  isJsxElementWithCssProp,
  visitJsxElementWithCssProp,
} from './visitors/visit-jsx-element-with-css-prop';
import { visitSourceFileEnsureDefaultReactImport } from './visitors/visit-source-file-ensure-default-react-import';
import { getIdentifierText, getExpressionText } from '../utils/ast-node';

const JSX_PRAGMA = 'jsx';
const LOCAL_DEVELOPMENT_MODULE = '../src';

const isJsxPragmaFoundWithOurJsxFunction = (sourceFile: ts.SourceFile) => {
  return (
    (sourceFile as any).pragmas.get(JSX_PRAGMA) &&
    // Only continue if we've found an import for this pkg.
    sourceFile.statements.find(statement => {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
        return false;
      }

      return (
        // Probably also want to check the consumer is using "jsx" here.
        statement.moduleSpecifier.text === packageName ||
        statement.moduleSpecifier.text === LOCAL_DEVELOPMENT_MODULE
      );
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
        transformedSourceFile = visitSourceFileEnsureDefaultReactImport(sourceFile);
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

        if (ts.isImportDeclaration(node)) {
          // we may use these. store for later and if needed then resolve them.
          // TODO: Get name and shit properly.
          if (getExpressionText(node.moduleSpecifier) === './1') {
            const resolvedFileSource = program.getSourceFile(
              // @ts-ignore
              sourceFile.resolvedModules.get('./1').resolvedFileName
            );

            const visitor = (node: ts.Node): ts.Node => {
              // TODO: Clean this shit up.
              if (ts.isVariableStatement(node) && node.modifiers && node.modifiers[0]) {
                // we may need this later, let's store it in a POJO for quick access.
                const variableDeclaration = node.declarationList.declarations[0];
                foundVariableDeclarations[getIdentifierText(variableDeclaration.name)] =
                  node.declarationList.declarations[0];
                return node;
              }

              return ts.visitEachChild(node, visitor, context);
            };
            ts.visitNode(resolvedFileSource, visitor);
          }
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
