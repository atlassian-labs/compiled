import type { NodePath } from '@babel/traverse';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

/**
 * Returns the nodes path including the scope of a parent.
 * @param node
 * @param parentPath
 */
export const getPathOfNode = <TNode extends unknown>(
  node: TNode,
  parentPath: NodePath
): NodePath<TNode> => {
  let foundPath: NodePath | null = null;

  traverse(
    t.expressionStatement(node as any),
    {
      enter(path) {
        foundPath = path;
        path.stop();
      },
    },
    parentPath.scope,
    undefined,
    parentPath
  );

  if (!foundPath) {
    throw parentPath.buildCodeFrameError('No path for a child node was found.');
  }

  return foundPath;
};

/**
 * Builds a code frame error from a passed in node.
 *
 * @param error
 * @param node
 * @param parentPath
 */
export const buildCodeFrameError = (
  error: string,
  node: t.Node | null,
  parentPath: NodePath<any>
): Error => {
  if (!node) {
    throw parentPath.buildCodeFrameError(error);
  }

  const startLoc = node.loc ? ` (${node.loc.start.line}:${node.loc.start.column})` : '';

  return getPathOfNode(node, parentPath).buildCodeFrameError(`${error}${startLoc}.`);
};

/**
 * Will return either the name of an identifier or the value of a string literal.
 *
 * E.g:
 * - `foo` identifier node will return `"foo"`,
 * - `"bar"` string literal node will return `"bar"`.
 *
 * @param node
 */
export const getKey = (node: t.Expression): string => {
  if (t.isIdentifier(node)) {
    return node.name;
  }

  if (t.isStringLiteral(node)) {
    return node.value;
  }

  throw new Error(`${node.type} has no name.'`);
};

/**
 * Will wrap BlockStatement or Expression in an IIFE,
 * Looks like (() => { return 10; })().
 *
 * @param node Node of type either BlockStatement or Expression
 */
export const wrapNodeInIIFE = (node: t.BlockStatement | t.Expression): t.CallExpression =>
  t.callExpression(t.arrowFunctionExpression([], node), []);

const tryWrappingBlockStatementInIIFE = (node: t.BlockStatement | t.Expression) =>
  t.isBlockStatement(node) ? wrapNodeInIIFE(node) : node;

/**
 * Will pick `Function` body and tries to wrap it in an IIFE if
 * its a BlockStatement otherwise returns the picked body,
 * E.g.
 * `props => props.color` would end up as `props.color`.
 * `props => { return props.color; }` would end up as `(() => { return props.color })()`
 * `function () { return props.color; }` would end up as `(function () { return props.color })()`
 *
 * @param node Node of type ArrowFunctionExpression
 */
export const pickFunctionBody = (node: t.Function): t.Expression =>
  tryWrappingBlockStatementInIIFE(node.body);
