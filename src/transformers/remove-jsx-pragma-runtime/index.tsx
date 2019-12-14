import * as ts from 'typescript';
import * as logger from '../utils/log';
import { IS_CSS_FREEDOM_COMPILED } from '../../jsx/index';

const UNCOMPILED_GUARD_VARIABLE_NAME = Object.keys({ IS_CSS_FREEDOM_COMPILED })[0];

const getEscapedText = (node: ts.BindingName): string => {
  return (node as ts.Identifier).escapedText as string;
};

const isCssFreedomCompiledNode = (node: ts.Node): node is ts.VariableDeclaration => {
  return (
    ts.isVariableDeclaration(node) && getEscapedText(node.name) === UNCOMPILED_GUARD_VARIABLE_NAME
  );
};

export default function removePragmaRuntime() {
  const transformerFactory: ts.TransformerFactory<ts.SourceFile> = context => {
    return sourceFile => {
      const visitor = (node: ts.Node): ts.Node => {
        if (isCssFreedomCompiledNode(node)) {
          logger.log(`setting "${UNCOMPILED_GUARD_VARIABLE_NAME}" variable to true`);

          // Reassign the variable declarations to `true` so it doesn't blow up at runtime.
          const newNode = ts.updateVariableDeclaration(
            node,
            ts.createIdentifier(getEscapedText(node.name)),
            ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
            ts.createTrue()
          );

          return newNode;
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(sourceFile, visitor);
    };
  };

  return transformerFactory;
}
