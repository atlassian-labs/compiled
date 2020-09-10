// TODO: Please fix this eslint rule. It is showing error for function declarations also.
/* eslint-disable @typescript-eslint/no-use-before-define */

import * as t from '@babel/types';
import traverse from '@babel/traverse';

import { Metadata } from '../types';

import {
  pickFunctionBody,
  resolveBindingNode,
  getMemberExpressionMeta,
  getValueFromObjectExpression,
  tryEvaluateExpression,
} from './ast';

/**
 * Will look in an expression and return the actual value along with updated metadata.
 *
 * E.g: If there is an identifier called `color` that is set somewhere as `const color = 'blue'`,
 * passing the `color` identifier to this function would return `'blue'`.
 *
 * @param expression Expression we want to interrogate.
 * @param state Babel state - should house options and meta data used during the transformation.
 */
const getInterpolationForIdentifier = (expression: t.Identifier, meta: Metadata) => {
  let value: t.Node | undefined | null = undefined;
  let newMeta: Metadata = meta;

  const binding = newMeta.parentPath.scope.getBinding(expression.name);
  const resolvedBinding = resolveBindingNode(binding, newMeta);

  if (binding?.path.node === expression) {
    // We resolved to the same node - bail out!
    return { value: expression, meta: newMeta };
  }

  if (resolvedBinding && resolvedBinding.constant) {
    // We recursively call get interpolation until it not longer returns an identifier or member expression
    ({ value, meta: newMeta } = getInterpolation(
      resolvedBinding.node as t.Expression,
      resolvedBinding.meta
    ));
  }

  return { value, meta: newMeta };
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
const getInterpolationForMemberExpression = (expression: t.MemberExpression, meta: Metadata) => {
  let value: t.Node | undefined | null = undefined;
  let newMeta: Metadata = meta;

  const { accessPath, bindingIdentifier } = getMemberExpressionMeta(expression);
  const binding = newMeta.parentPath.scope.getBinding(bindingIdentifier.name);
  const resolvedBinding = resolveBindingNode(binding, newMeta);

  if (resolvedBinding && resolvedBinding.constant && t.isObjectExpression(resolvedBinding.node)) {
    const objectValue = getValueFromObjectExpression(
      resolvedBinding.node,
      accessPath
    ) as t.Expression;
    // We recursively call get interpolation until it not longer returns an identifier or member expression
    ({ value, meta: newMeta } = getInterpolation(objectValue, resolvedBinding.meta));
  }

  return { value, meta: newMeta };
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
const getInterpolationForFunction = (expression: t.Function, meta: Metadata) =>
  getInterpolation(pickFunctionBody(expression), meta);

/**
 * Will look in an expression and return the actual value along with updated metadata.
 *
 * E.g: If there was an IIFE called `size` that is set somewhere as
 * `const size = (() => 10)()` or `const size = (function() { return 10; })()`,
 * passing the `size` identifier to this function would return `10` (it will recursively evaluate).
 *
 * @param expression Expression we want to interrogate.
 * @param state Babel state - should house options and meta data used during the transformation.
 */
const getInterpolationForIIFE = (expression: t.Function, meta: Metadata) => {
  let value: t.Node | undefined | null = undefined;
  let newMeta: Metadata = meta;

  if (t.isBlockStatement(expression.body)) {
    traverse(expression.body, {
      noScope: true,
      ReturnStatement(path) {
        const { argument } = path.node;

        if (argument) {
          ({ value, meta: newMeta } = getInterpolation(argument, meta));
        }

        path.stop();
      },
    });
  } else {
    ({ value, meta: newMeta } = getInterpolation(expression.body, meta));
  }

  return { value, meta: newMeta };
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
const getInterpolation = (
  expression: t.Expression,
  meta: Metadata
): { value: t.Expression; meta: Metadata } => {
  let value: t.Node | undefined | null = undefined;
  let newMeta: Metadata = meta;

  if (t.isIdentifier(expression)) {
    ({ value, meta: newMeta } = getInterpolationForIdentifier(expression, newMeta));
  } else if (t.isMemberExpression(expression)) {
    ({ value, meta: newMeta } = getInterpolationForMemberExpression(expression, newMeta));
  } else if (t.isFunction(expression)) {
    ({ value, meta: newMeta } = getInterpolationForFunction(expression, newMeta));
  } else if (t.isCallExpression(expression) && t.isFunction(expression.callee)) {
    ({ value, meta: newMeta } = getInterpolationForIIFE(expression.callee, newMeta));
  }

  if (t.isStringLiteral(value) || t.isNumericLiteral(value) || t.isObjectExpression(value)) {
    return { value, meta: newMeta };
  }

  // --------------
  // NOTE: We are recursively calling getInterpolation() which is then going to try and evaluate it
  // multiple times. This may or may not be a performance problem - when looking for quick wins perhaps
  // there is something we could do better here.
  // --------------

  if (value) {
    return {
      value: tryEvaluateExpression(value as t.Expression, newMeta, expression),
      meta: newMeta,
    };
  }

  return { value: tryEvaluateExpression(expression, newMeta), meta: newMeta };
};

export default getInterpolation;
