import type * as t from '@babel/types';

import type { Metadata } from '../../../types';
import type { createResultPair } from '../common';

export type TraverseHandlers = {
  callExpression: (
    expression: t.CallExpression,
    meta: Metadata
  ) => ReturnType<typeof createResultPair>;
  memberExpression: (
    expression: t.MemberExpression,
    meta: Metadata
  ) => ReturnType<typeof createResultPair>;
};
