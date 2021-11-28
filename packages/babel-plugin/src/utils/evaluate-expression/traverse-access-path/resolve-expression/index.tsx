import * as t from '@babel/types';

import type { Metadata } from '../../../../types';
import { createResultPair } from '../../common';
import type { TraverseHandlers } from '../types';

import { getFunctionArgs } from './function-args';
import { evaluateIdentifier } from './identifier';

export const resolveExpressionInMember = (
  expression: t.Expression,
  meta: Metadata,
  expressionName: string,
  memberExpression: t.MemberExpression,
  traversers: TraverseHandlers
): ReturnType<typeof createResultPair> => {
  let result = createResultPair(expression, meta);

  if (t.isIdentifier(expression)) {
    result = evaluateIdentifier(expression, meta);
  } else if (t.isFunction(expression)) {
    // Function expressions are the declaration and not the function call
    // itself, the arguments are stored in the member expression
    const callExpression = t.callExpression(
      expression,
      getFunctionArgs(expressionName, memberExpression)
    );
    result = traversers.callExpression(callExpression, meta);
  } else if (t.isCallExpression(expression)) {
    result = traversers.callExpression(expression, meta);
  } else if (t.isMemberExpression(expression)) {
    result = traversers.memberExpression(expression, meta);
  }

  // Recursively resolve expression until we extracted its value node or
  // have reach its origin declaration
  if (result.value !== expression) {
    return resolveExpressionInMember(
      result.value,
      result.meta,
      expressionName,
      memberExpression,
      traversers
    );
  }

  return result;
};
