import traverse from '@babel/traverse';
import * as t from '@babel/types';

import type { Result } from './types';

export const getObjectPropertyValue = (
  object: t.ObjectExpression,
  propertyName: string
): Result<t.ObjectProperty> | undefined => {
  let result;

  traverse(object, {
    noScope: true,
    ObjectProperty(path) {
      if (t.isIdentifier(path.node.key, { name: propertyName })) {
        result = { path, node: path.node.value };
        path.stop();
      }
    },
  });

  return result;
};
