import * as ts from 'typescript';
import * as logger from '../utils/log';
import { IS_CSS_FREEDOM_COMPILED } from '../../../css-in-js/src/jsx/index';
import { getIdentifierText } from '../utils/ast-node';

const UNCOMPILED_GUARD_VARIABLE_NAME = Object.keys({ IS_CSS_FREEDOM_COMPILED })[0];

const isCssFreedomCompiledNode = (node: ts.Node): node is ts.VariableDeclaration => {
  return (
    ts.isVariableDeclaration(node) &&
    getIdentifierText(node.name) === UNCOMPILED_GUARD_VARIABLE_NAME
  );
};

export default function removePragmaRuntime(_: ts.Program): ts.TransformerFactory<ts.SourceFile> {
  const transformerFactory: ts.TransformerFactory<ts.SourceFile> = context => {
    return sourceFile => {
      const visitor = (node: ts.Node): ts.Node => {
        if (isCssFreedomCompiledNode(node)) {
          logger.log(`setting "${UNCOMPILED_GUARD_VARIABLE_NAME}" variable to true`);

          // Reassign the variable declarations to `true` so it doesn't blow up at runtime.
          const newNode = ts.updateVariableDeclaration(
            node,
            ts.createIdentifier(getIdentifierText(node.name)),
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
