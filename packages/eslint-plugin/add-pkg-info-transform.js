/**
 * @fileoverview
 * This file is a transformer to be used with `ttypescript` to replace the version
 * and name of the eslint plugin in the source from the package.json at compile time.
 */

// @ts-check
// eslint-disable-next-line import/no-extraneous-dependencies
const ts = require('typescript');

const pkgJson = require('./package.json');

/**
 *
 * @param {ts.Node} node
 * @param {string} name
 * @param {string} value
 * @returns {node is ts.VariableDeclaration & {name: ts.Identifier, initializer: ts.StringLiteral}}
 */
const isVariableWithProperties = (node, name, value) =>
  !!(
    ts.isVariableDeclaration(node) &&
    ts.isIdentifier(node.name) &&
    node.name.text === name &&
    node.initializer &&
    ts.isStringLiteral(node.initializer) &&
    node.initializer.text === value
  );

/**
 * @param {ts.Program} _ts
 * @returns {ts.TransformerFactory<ts.SourceFile>}
 */
const transformer = (_ts) => (context) => (sourceFile) => {
  /**
   * @param {ts.Node} node
   * @returns {ts.Node}
   */
  const visitor = (node) => {
    if (isVariableWithProperties(node, 'name', '/* NAME */')) {
      return ts.factory.updateVariableDeclaration(
        node,
        node.name,
        undefined,
        undefined,
        ts.factory.createStringLiteral(pkgJson.name)
      );
    }

    if (isVariableWithProperties(node, 'version', '/* VERSION */')) {
      return ts.factory.updateVariableDeclaration(
        node,
        node.name,
        undefined,
        undefined,
        ts.factory.createStringLiteral(pkgJson.version)
      );
    }

    return ts.visitEachChild(node, visitor, context);
  };
  return ts.visitNode(sourceFile, visitor);
};

module.exports = transformer;
