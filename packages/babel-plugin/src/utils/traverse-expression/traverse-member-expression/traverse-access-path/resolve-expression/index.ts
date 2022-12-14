import * as t from '@babel/types';

import type { Metadata } from '../../../../../types';
import { createResultPair } from '../../../../create-result-pair';
import { isCompiledCSSCallExpression } from '../../../../is-compiled';
import type { EvaluateExpression } from '../../../../types';

import { getFunctionArgs } from './function-args';
import { evaluateIdentifier } from './identifier';

export const resolveExpressionInMember = (
  expression: t.Expression,
  meta: Metadata,
  expressionName: string,
  memberExpression: t.MemberExpression,
  evaluateExpression: EvaluateExpression
): ReturnType<typeof createResultPair> => {
  let result = createResultPair(expression, meta);

  if (t.isIdentifier(expression)) {
    result = evaluateIdentifier(expression, meta, evaluateExpression);
  } else if (t.isFunction(expression)) {
    // Function expressions are the declaration and not the function call
    // itself, the arguments are stored in the member expression
    const callExpression = t.callExpression(
      expression,
      getFunctionArgs(expressionName, memberExpression)
    );
    result = evaluateExpression(callExpression, meta);
  } else if (
    isCompiledCSSCallExpression(expression, meta.state) &&
    t.isExpression(expression.arguments[0])
  ) {
    result = evaluateExpression(expression.arguments[0], meta);
  } else if (t.isCallExpression(expression) || t.isMemberExpression(expression)) {
    result = evaluateExpression(expression, meta);
  }

  // Recursively resolve expression until we extracted its value node or
  // have reach its origin declaration
  if (result.value !== expression) {
    return resolveExpressionInMember(
      result.value,
      result.meta,
      expressionName,
      memberExpression,
      evaluateExpression
    );
  }

  return result;
};
