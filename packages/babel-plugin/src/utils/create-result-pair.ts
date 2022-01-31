import type * as t from '@babel/types';

import type { Metadata } from '../types';

export const createResultPair = (
  value: t.Expression,
  meta: Metadata
): {
  value: t.Expression;
  meta: Metadata;
} => ({
  value,
  meta,
});
