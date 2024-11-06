import * as t from '@babel/types';

/**
 * Return true if (and only if) the current node is a
 * `injectCss()` function call.
 *
 * @param node
 * @returns if the node is `injectCss()`
 */
export const isInjectGlobalCss = (node: t.Node): boolean => {
  return (
    t.isCallExpression(node) && t.isIdentifier(node.callee) && node.callee.name === 'injectCss'
  );
};
