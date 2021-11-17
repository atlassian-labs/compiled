import * as t from '@babel/types';

/**
 * Returns `true` if `node` looks like a `jsx()` like call expression.
 *
 * @param node
 * @param func
 * @returns
 */
export const isAutomaticRuntime = (
  node: t.Node,
  func: 'jsx' | 'jsxs'
): node is t.CallExpression => {
  if (t.isCallExpression(node) && t.isIdentifier(node.callee) && node.callee.name === `_${func}`) {
    return true;
  }

  if (
    t.isCallExpression(node) &&
    t.isSequenceExpression(node.callee) &&
    t.isMemberExpression(node.callee.expressions[1]) &&
    t.isIdentifier(node.callee.expressions[1].property) &&
    node.callee.expressions[1].property.name === func
  ) {
    return true;
  }

  return false;
};
