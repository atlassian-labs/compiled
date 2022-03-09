import type * as t from '@babel/types';

import type { Metadata } from '../../types';
import type { createResultPair } from '../create-result-pair';

export type traverseMemberExpressionHandler = (
  expression: t.MemberExpression,
  meta: Metadata
) => ReturnType<typeof createResultPair>;

export type TraverseHandlers = {
  callExpression: (
    expression: t.CallExpression,
    meta: Metadata
  ) => ReturnType<typeof createResultPair>;
  memberExpression: traverseMemberExpressionHandler;
};
