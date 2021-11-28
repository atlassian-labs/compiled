import type * as t from '@babel/types';

import { getObjectProperty } from '../../../traversers';
import type { Metadata } from '../../../../types';
import { createResultPair } from '../../common';

export const evaluateObjectPath = (
  expression: t.ObjectExpression,
  meta: Metadata,
  propertyName: string
): ReturnType<typeof createResultPair> => {
  const result = getObjectProperty(expression, propertyName);

  return createResultPair(result ? (result.node as t.Expression) : expression, meta);
};
