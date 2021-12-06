import type * as t from '@babel/types';

import type { Metadata } from '../../../../types';
import { getObjectPropertyValue } from '../../../traversers';
import { createResultPair } from '../../common';

export const evaluateObjectPath = (
  expression: t.ObjectExpression,
  meta: Metadata,
  propertyName: string
): ReturnType<typeof createResultPair> => {
  const result = getObjectPropertyValue(expression, propertyName);

  return createResultPair(result ? (result.node as t.Expression) : expression, meta);
};
