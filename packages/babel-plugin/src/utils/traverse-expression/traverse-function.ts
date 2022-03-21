import traverse from '@babel/traverse';
import * as t from '@babel/types';

import type { Metadata } from '../../types';
import { createResultPair } from '../create-result-pair';
import type { EvaluateExpression } from '../types';

/**
 * Will look in an expression and return the actual value along with updated metadata.
 *
 * E.g: If there was a function called `size` that is set somewhere as
 * `const size = () => 10` or `const size = function() { return 10; }` or `function size() { return 10; }`,
 * passing the `size` identifier to this function would return `10` (it will recursively evaluate).
 *
 * @param expression Expression we want to interrogate.
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 */
export const traverseFunction = (
  expression: t.Function,
  meta: Metadata,
  evaluateExpression: EvaluateExpression
): ReturnType<typeof createResultPair> => {
  let value: t.Node | undefined | null = undefined;
  let updatedMeta: Metadata = meta;

  if (t.isBlockStatement(expression.body)) {
    traverse(expression.body, {
      noScope: true,
      ReturnStatement(path) {
        const { argument } = path.node;

        if (argument) {
          ({ value, meta: updatedMeta } = evaluateExpression(argument, meta));
        }

        path.stop();
      },
    });
  } else {
    ({ value, meta: updatedMeta } = evaluateExpression(expression.body, meta));
  }

  return createResultPair(value as t.Expression, updatedMeta);
};
