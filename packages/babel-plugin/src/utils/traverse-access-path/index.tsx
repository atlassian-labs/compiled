import type * as t from '@babel/types';

import type { Metadata } from '../../types';
import { createResultPair } from '../create-result-pair';
import { traverseCallExpression } from '../traverse-expression';

import { evaluatePath } from './evaluate-path';
import { resolveExpressionInMember } from './resolve-expression';
import type { TraverseHandlers, traverseMemberExpressionHandler } from './types';

export const traverseMemberAccessPath = (
  expression: t.Expression,
  meta: Metadata,
  expressionName: string,
  accessPath: t.Identifier[],
  memberExpression: t.MemberExpression,
  traverseMemberExpression: traverseMemberExpressionHandler
): ReturnType<typeof createResultPair> => {
  const traversers: TraverseHandlers = {
    callExpression: traverseCallExpression,
    memberExpression: traverseMemberExpression,
  };
  const { value: resolvedExpression, meta: updatedMeta } = resolveExpressionInMember(
    expression,
    meta,
    expressionName,
    memberExpression,
    traversers
  );

  if (accessPath.length) {
    const pathName = accessPath[0].name;
    const result = evaluatePath(resolvedExpression, updatedMeta, pathName);

    return traverseMemberAccessPath(
      result.value,
      result.meta,
      pathName,
      accessPath.slice(1),
      memberExpression,
      traverseMemberExpression
    );
  }

  return createResultPair(resolvedExpression, updatedMeta);
};
