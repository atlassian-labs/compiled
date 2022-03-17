import type * as t from '@babel/types';

import type { Metadata } from '../../types';
import { createResultPair } from '../create-result-pair';
import { resolveBinding } from '../resolve-binding';
import type { EvaluateExpression } from '../types';

/**
 * Will look in an expression and return the actual value along with updated metadata.
 *
 * E.g: If there is an identifier called `color` that is set somewhere as `const color = 'blue'`,
 * passing the `color` identifier to this function would return `'blue'`.
 *
 * @param expression Expression we want to interrogate.
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 */
export const traverseIdentifier = (
  expression: t.Identifier,
  meta: Metadata,
  evaluateExpression: EvaluateExpression
): ReturnType<typeof createResultPair> => {
  let value: t.Node | undefined | null = undefined;
  let updatedMeta: Metadata = meta;

  const resolvedBinding = resolveBinding(expression.name, updatedMeta, evaluateExpression);

  if (resolvedBinding && resolvedBinding.constant && resolvedBinding.node) {
    // We recursively call get interpolation until it not longer returns an identifier or member expression
    ({ value, meta: updatedMeta } = evaluateExpression(
      resolvedBinding.node as t.Expression,
      resolvedBinding.meta
    ));
  }

  return createResultPair(value as t.Expression, updatedMeta);
};
