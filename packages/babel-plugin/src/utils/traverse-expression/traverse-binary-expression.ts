import * as t from '@babel/types';

import type { Metadata } from '../../types';
import { createResultPair } from '../create-result-pair';
import { hasNumericValue } from '../has-numeric-value';
import type { EvaluateExpression } from '../types';

export const traverseBinaryExpression = (
  expression: t.BinaryExpression,
  meta: Metadata,
  evaluateExpression: EvaluateExpression
): ReturnType<typeof createResultPair> => {
  if (!t.isPrivateName(expression.left)) {
    const { value: left } = evaluateExpression(expression.left, meta);
    const { value: right } = evaluateExpression(expression.right, meta);

    if (hasNumericValue(left) && hasNumericValue(right)) {
      return createResultPair(t.binaryExpression(expression.operator, left, right), meta);
    }
  }

  return createResultPair(expression, meta);
};
