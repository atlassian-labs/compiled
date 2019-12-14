import * as ts from 'typescript';
import * as logger from '../utils/log';
import { name as packageName } from '../../../package.json';
import { VariableDeclarations } from './types';
import {
  isJsxElementWithCssProp,
  visitJsxElementWithCssProp,
} from './visit-jsx-element-with-css-prop';
import { visitSourceFileEnsureDefaultReactImport } from './visit-source-file-ensure-default-react-import';

const JSX_PRAGMA = 'jsx';
const LOCAL_DEVELOPMENT_MODULE = '../src';

const isJsxPragmaFoundWithOurJsxFunction = (sourceFile: ts.SourceFile) => {
  return (
    (sourceFile as any).localJsxNamespace === JSX_PRAGMA &&
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

export default function cssPropTransformer() {
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
          foundVariableDeclarations[node.name.getText()] = node;
          return ts.visitEachChild(node, visitor, context);
        }

        if (isJsxElementWithCssProp(node)) {
          const newNode = visitJsxElementWithCssProp(node, foundVariableDeclarations);
          return ts.visitEachChild(newNode, visitor, context);
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(transformedSourceFile, visitor);
    };
  };

  return transformerFactory;
}
