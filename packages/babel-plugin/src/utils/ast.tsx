import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

export const getPathOfNode = (node: any, parentPath: NodePath): NodePath => {
  let foundPath: NodePath | null = null;

  traverse(
    t.expressionStatement(node),
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
    throw new Error('node has no path');
  }

  return foundPath;
};
