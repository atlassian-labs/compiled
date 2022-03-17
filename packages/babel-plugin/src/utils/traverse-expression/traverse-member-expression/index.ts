import traverse from '@babel/traverse';
import * as t from '@babel/types';

import type { Metadata } from '../../../types';
import { createResultPair } from '../../create-result-pair';
import type { EvaluateExpression } from '../../types';

import { traverseMemberAccessPath } from './traverse-access-path';

/**
 * Returns the binding identifier for a member expression.
 *
 * For example:
 * 1. Member expression `foo.bar.baz` will return the `foo` identifier along
 * with `originalBindingType` as 'Identifier'.
 * 2. Member expression with function call `foo().bar.baz` will return the
 * `foo` identifier along with `originalBindingType` as 'CallExpression'.
 * 3. We also want to process call expressions with a member expression callee
 * i.e. `foo.bar.baz()`
 * @param expression - Member expression node.
 */
const getMemberExpressionMeta = (
  expression: t.MemberExpression
): {
  accessPath: t.Identifier[];
  bindingIdentifier: t.Identifier | null;
  originalBindingType: t.Expression['type'];
} => {
  const accessPath: t.Identifier[] = [];
  let bindingIdentifier: t.Identifier | null = null;
  let originalBindingType: t.Expression['type'] = 'Identifier';

  traverse(t.expressionStatement(expression), {
    noScope: true,
    MemberExpression(path) {
      // Skip if member comes from call expression arguments
      if (path.listKey === 'arguments') {
        return;
      }

      if (t.isIdentifier(path.node.object)) {
        bindingIdentifier = path.node.object;
        originalBindingType = bindingIdentifier.type;
      } else if (t.isCallExpression(path.node.object)) {
        if (t.isIdentifier(path.node.object.callee)) {
          bindingIdentifier = path.node.object.callee;
          originalBindingType = path.node.object.type;
        }
      }

      if (t.isIdentifier(path.node.property)) {
        accessPath.push(path.node.property);
      } else if (
        // Adds the function name of the trailing call expression
        t.isCallExpression(path.node.property) &&
        t.isIdentifier(path.node.property.callee)
      ) {
        accessPath.push(path.node.property.callee);
      }
    },
  });

  return {
    accessPath: accessPath.reverse(),
    bindingIdentifier,
    originalBindingType,
  };
};

/**
 * Will look in an expression and return the actual value along with updated metadata.
 *
 * E.g: If there is a member expression called `colors.primary` that has identifier `color` which
 * is set somewhere as `const colors = { primary: 'blue' }`,
 * passing the `colors` identifier to this function would return `'blue'`.
 *
 * @param expression Expression we want to interrogate.
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 */
export const traverseMemberExpression = (
  expression: t.MemberExpression,
  meta: Metadata,
  evaluateExpression: EvaluateExpression
): ReturnType<typeof createResultPair> => {
  const { accessPath, bindingIdentifier } = getMemberExpressionMeta(expression);

  if (bindingIdentifier) {
    return traverseMemberAccessPath(
      t.identifier(bindingIdentifier.name),
      meta,
      bindingIdentifier.name,
      accessPath,
      expression,
      evaluateExpression
    );
  }

  return createResultPair(expression, meta);
};
