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

  const resolvedBinding = resolveBindingNode(expression.name, updatedMeta);

  if (resolvedBinding && resolvedBinding.constant) {
    // We recursively call get interpolation until it not longer returns an identifier or member expression
    ({ value, meta: updatedMeta } = evaluateExpression(
      resolvedBinding.node as t.Expression,
      resolvedBinding.meta
    ));
  }

  return createResultPair(value as t.Expression, updatedMeta);
};

/**
 * Will evaluate object values recursively and return the actual value along with updated metadata.
 *
 * E.g: If there is an object expression `{ x: () => 10 }`, it will evaluate and
 * return `value` as `10`.
 * @param expression Expression we want to interrogate.
 * @param accessPath An array of nested object keys
 * @param meta Meta data used during the transformation.
 */
const evaluateObjectExpression = (
  expression: t.Expression,
  accessPath: t.Identifier[],
  meta: Metadata
) => {
  let value: t.Node | undefined | null = expression;
  let updatedMeta: Metadata = meta;

  if (t.isObjectExpression(expression)) {
    const objectValue = getValueFromObjectExpression(expression, accessPath) as t.Expression;

    ({ value, meta: updatedMeta } = evaluateExpression(objectValue, updatedMeta));
  }

  return createResultPair(value, updatedMeta);
};

/**
 * Will look in an expression and return the actual value along with updated metadata.
 *
 * E.g: If there is a member expression called `colors().primary` that has identifier `colors` which
 * is set somewhere as `const colors = () => ({ primary: 'blue' })`,
 * passing the `colors` identifier to this function would return `'blue'`.
 *
 * @param expression Expression we want to interrogate.
 * @param accessPath An array of nested object keys
 * @param meta Meta data used during the transformation.
 */
const evaluateCallExpressionBindingMemberExpression = (
  expression: t.Expression,
  accessPath: t.Identifier[],
  meta: Metadata
) => {
  let value: t.Node | undefined | null = expression;
  let updatedMeta: Metadata = meta;

  if (t.isFunction(expression)) {
    ({ value, meta: updatedMeta } = evaluateExpression(expression as t.Expression, meta));

    ({ value, meta: updatedMeta } = evaluateObjectExpression(value, accessPath, updatedMeta));
  }

  return createResultPair(value, updatedMeta);
};

/**
 * Will look in an expression and return the actual value along with updated metadata.
 *
 * E.g:
 * 1. If there is a member expression called `colors.primary` that has identifier `colors` which
 * is set somewhere as `const colors = { primary: 'blue' }`,
 * passing the `colors` identifier to this function would return `'blue'`.
 *
 * 2. If there is a member expression called `colors.primary` that has identifier `colors` which
 * is set somewhere as `const colors = colorMixin();` calling another identifier
 * `const colorMixin = () => ({ primary: 'blue' })`, passing the `colors` identifier
 * to this function would return `'blue'`.
 *
 * @param expression Expression we want to interrogate.
 * @param accessPath An array of nested object keys
 * @param meta Meta data used during the transformation.
 */
const evaluateIdentifierBindingMemberExpression = (
  expression: t.Expression,
  accessPath: t.Identifier[],
  meta: Metadata
) => {
  let value: t.Node | undefined | null = expression;
  let updatedMeta: Metadata = meta;

  if (t.isObjectExpression(expression)) {
    ({ value, meta: updatedMeta } = evaluateObjectExpression(expression, accessPath, meta));
  } else if (t.isCallExpression(expression) && t.isExpression(expression.callee)) {
    ({ value, meta: updatedMeta } = evaluateExpression(expression.callee, meta));
    ({ value, meta: updatedMeta } = evaluateObjectExpression(value, accessPath, updatedMeta));
  }

  return createResultPair(value, updatedMeta);
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

  const { accessPath, bindingIdentifier, originalBindingType } = getMemberExpressionMeta(
    expression
  );

  if (bindingIdentifier) {
    const resolvedBinding = resolveBindingNode(bindingIdentifier.name, updatedMeta);

    if (resolvedBinding && resolvedBinding.constant && t.isExpression(resolvedBinding.node)) {
      if (originalBindingType === 'Identifier') {
        ({ value, meta: updatedMeta } = evaluateIdentifierBindingMemberExpression(
          resolvedBinding.node,
          accessPath,
          resolvedBinding.meta
        ));
      } else if (originalBindingType === 'CallExpression') {
        ({ value, meta: updatedMeta } = evaluateCallExpressionBindingMemberExpression(
          resolvedBinding.node,
          accessPath,
          resolvedBinding.meta
        ));
      }
    }
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
export const evaluateExpression = (
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
  } else if (t.isCallExpression(expression) && t.isExpression(expression.callee)) {
    ({ value, meta: updatedMeta } = evaluateExpression(expression.callee, updatedMeta));
  }

  if (t.isStringLiteral(value) || t.isNumericLiteral(value) || t.isObjectExpression(value)) {
    return createResultPair(value, updatedMeta);
  }

  // --------------
  // NOTE: We are recursively calling evaluateExpression() which is then going to try and evaluate it
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
