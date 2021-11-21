import * as t from '@babel/types';

/**
 * Returns `true` if `node` looks like `CC` identifier.
 *
 * @param node
 * @returns
 */
export const isCCComponent = (node: t.Node): boolean => {
  if (t.isIdentifier(node) && node.name === 'CC') {
    return true;
  }

  if (t.isMemberExpression(node) && t.isIdentifier(node.property) && node.property.name === 'CC') {
    return true;
  }

  return false;
};
