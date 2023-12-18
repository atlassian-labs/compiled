import * as t from '@babel/types';

/**
 * Return true if (and only if) the current node is a
 * `React.createElement()` function call.
 *
 * @param node
 * @returns if the node is `React.createElement()`
 */
export const isCreateElement = (node: t.Node): node is t.CallExpression => {
  return (
    t.isMemberExpression(node) &&
    t.isIdentifier(node.object) &&
    node.object.name === 'React' &&
    t.isIdentifier(node.property) &&
    node.property.name === 'createElement'
  );
};
