// TODO: Please fix this eslint rule. It is showing error for function declarations also.
/* eslint-disable @typescript-eslint/no-use-before-define */

import * as t from '@babel/types';
import traverse from '@babel/traverse';

import { Metadata } from '../types';

import {
  resolveBindingNode,
  getMemberExpressionMeta,
  getValueFromObjectExpression,
  tryEvaluateExpression,
} from './ast';

const createResultPair = (value: t.Expression, meta: Metadata) => ({
  value,
  meta,
});

/**
 * Will look in an expression and return the actual value along with updated metadata.
 *
 * E.g: If there is an identifier called `color` that is set somewhere as `const color = 'blue'`,
 * passing the `color` identifier to this function would return `'blue'`.
 *
 * @param expression Expression we want to interrogate.
 * @param state Babel state - should house options and meta data used during the transformation.
 */
const traverseIdentifier = (expression: t.Identifier, meta: Metadata) => {
  let value: t.Node | undefined | null = undefined;
  let updatedMeta: Metadata = meta;

  const binding = updatedMeta.parentPath.scope.getBinding(expression.name);
  const resolvedBinding = resolveBindingNode(binding, updatedMeta);

  if (binding?.path.node === expression) {
    // We resolved to the same node - bail out!
    return { value: expression, meta: newMeta };
  }

  if (resolvedBinding && resolvedBinding.constant) {
    // We recursively call get interpolation until it not longer returns an identifier or member expression
    ({ value, meta: updatedMeta } = traverseExpressionWithEvaluation(
      resolvedBinding.node as t.Expression,
      resolvedBinding.meta
    ));
  }

  return createResultPair(value as t.Expression, updatedMeta);
};

/**
 * Will look in an expression and return the actual value along with updated metadata.
 *
 * E.g: If there is a member expression called `colors.primary` that has identifier `color` which
 * is set somewhere as `const colors = { primary: 'blue' }`,
 * passing the `colors` identifier to this function would return `'blue'`.
 *
 * @param expression Expression we want to interrogate.
 * @param state Babel state - should house options and meta data used during the transformation.
 */
const traverseMemberExpression = (expression: t.MemberExpression, meta: Metadata) => {
  let value: t.Node | undefined | null = undefined;
  let updatedMeta: Metadata = meta;

  const { accessPath, bindingIdentifier } = getMemberExpressionMeta(expression);
  const binding = updatedMeta.parentPath.scope.getBinding(bindingIdentifier.name);
  const resolvedBinding = resolveBindingNode(binding, updatedMeta);

  if (resolvedBinding && resolvedBinding.constant && t.isObjectExpression(resolvedBinding.node)) {
    const objectValue = getValueFromObjectExpression(
      resolvedBinding.node,
      accessPath
    ) as t.Expression;
    // We recursively call get interpolation until it not longer returns an identifier or member expression
    ({ value, meta: updatedMeta } = traverseExpressionWithEvaluation(
      objectValue,
      resolvedBinding.meta
    ));
  }

  return createResultPair(value as t.Expression, updatedMeta);
};

/**
 * Will look in an expression and return the actual value along with updated metadata.
 *
 * E.g: If there was a function called `size` that is set somewhere as
 * `const size = () => 10` or `const size = function() { return 10; }` or `function size() { return 10; }`,
 * passing the `size` identifier to this function would return `10` (it will recursively evaluate).
 *
 * @param expression Expression we want to interrogate.
 * @param state Babel state - should house options and meta data used during the transformation.
 */
const traverseFunction = (expression: t.Function, meta: Metadata) => {
  let value: t.Node | undefined | null = undefined;
  let updatedMeta: Metadata = meta;

  if (t.isBlockStatement(expression.body)) {
    traverse(expression.body, {
      noScope: true,
      ReturnStatement(path) {
        const { argument } = path.node;

        if (argument) {
          ({ value, meta: updatedMeta } = traverseExpressionWithEvaluation(argument, meta));
        }

        path.stop();
      },
    });
  } else {
    ({ value, meta: updatedMeta } = traverseExpressionWithEvaluation(expression.body, meta));
  }

  return createResultPair(value as t.Expression, updatedMeta);
};

/**
 * Will look in an expression and return the actual value along with updated metadata.
 * If the expression is an identifier node (a variable) and a constant,
 * it will return the variable reference.
 *
 * E.g: If there was a identifier called `color` that is set somewhere as `const color = 'blue'`,
 * passing the `color` identifier to this function would return `'blue'`.
 *
 * This behaviour is the same for const string & numeric literals,
 * and object expressions.
 *
 * @param expression Expression we want to interrogate.
 * @param state Babel state - should house options and meta data used during the transformation.
 */
export const traverseExpressionWithEvaluation = (
  expression: t.Expression,
  meta: Metadata
): { value: t.Expression; meta: Metadata } => {
  let value: t.Node | undefined | null = undefined;
  let updatedMeta: Metadata = meta;

  if (t.isIdentifier(expression)) {
    ({ value, meta: updatedMeta } = traverseIdentifier(expression, updatedMeta));
  } else if (t.isMemberExpression(expression)) {
    ({ value, meta: updatedMeta } = traverseMemberExpression(expression, updatedMeta));
  } else if (t.isFunction(expression)) {
    ({ value, meta: updatedMeta } = traverseFunction(expression, updatedMeta));
  }

  if (t.isStringLiteral(value) || t.isNumericLiteral(value) || t.isObjectExpression(value)) {
    return createResultPair(value, updatedMeta);
  }

  // --------------
  // NOTE: We are recursively calling traverseExpressionWithEvaluation() which is then going to try and evaluate it
  // multiple times. This may or may not be a performance problem - when looking for quick wins perhaps
  // there is something we could do better here.
  // --------------

  if (value) {
    return createResultPair(
      tryEvaluateExpression(value as t.Expression, updatedMeta, expression),
      updatedMeta
    );
  }

  return createResultPair(tryEvaluateExpression(expression, updatedMeta), updatedMeta);
};
