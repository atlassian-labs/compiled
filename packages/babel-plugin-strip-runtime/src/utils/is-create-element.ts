import * as t from '@babel/types';

/**
 * Returns `true` if `node` looks like `React.createElement()`.
 *
 * @param node
 * @returns
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
