import * as t from '@babel/types';

import type { Metadata } from '../../types';
import { createResultPair } from '../create-result-pair';
import { hasNumericValue } from '../has-numeric-value';
import type { EvaluateExpression } from '../types';

export const traverseUnaryExpression = (
  expression: t.UnaryExpression,
  meta: Metadata,
  evaluateExpression: EvaluateExpression
): ReturnType<typeof createResultPair> => {
  const { operator, argument } = expression;

  // If argument is already a numeric literal like -8 then skip
  if (operator === '-' && !hasNumericValue(argument)) {
    // Convert something like -getSpacing() to -1 * getSpacing()
    return createResultPair(
      t.binaryExpression('*', t.numericLiteral(-1), evaluateExpression(argument, meta).value),
      meta
    );
  }

  return createResultPair(expression, meta);
};
