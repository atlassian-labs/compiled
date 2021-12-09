import type * as t from '@babel/types';

import type { Metadata } from '../../../types';
import { createResultPair } from '../common';

import { evaluatePath } from './evaluate-path';
import { resolveExpressionInMember } from './resolve-expression';
import type { TraverseHandlers } from './types';

export const traverseMemberAccessPath = (
  expression: t.Expression,
  meta: Metadata,
  expressionName: string,
  accessPath: t.Identifier[],
  memberExpression: t.MemberExpression,
  traversers: TraverseHandlers
): ReturnType<typeof createResultPair> => {
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
      traversers
    );
  }

  return createResultPair(resolvedExpression, updatedMeta);
};
