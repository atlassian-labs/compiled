import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

import type { Metadata } from '../types';

import { getPathOfNode } from './ast';
import { createResultPair } from './create-result-pair';
import { isCompiledKeyframesCallExpression } from './is-compiled';
import {
  traverseBinaryExpression,
  traverseCallExpression,
  traverseFunction,
  traverseIdentifier,
  traverseMemberExpression,
  traverseUnaryExpression,
} from './traverse-expression';

/**
 * Returns `true` if an identifier or any paths that reference the identifier are mutated.
 * @param path
 */
const isIdentifierReferencesMutated = (path: NodePath<t.Identifier>): boolean => {
  const binding = path.scope.getBinding(path.node.name);
  if (!binding) {
    return false;
  }

  if (!t.isVariableDeclarator(binding.path.node) || !binding.constant) {
    return true;
  }

  for (let i = 0; i < binding.referencePaths.length; i++) {
    const refPath = binding.referencePaths[i];
    const innerBinding = refPath.scope.getBinding(path.node.name);
    if (!innerBinding) {
      continue;
    }

    if (!t.isVariableDeclarator(innerBinding.path.node) || !innerBinding.constant) {
      return true;
    }
  }

  return false;
};

/**
 * Will traverse a path and its identifiers to find all bindings.
 * If any of those bindings are mutated `true` will be returned.
 *
 * @param path
 */
const isPathReferencingAnyMutatedIdentifiers = (path: NodePath<any>): boolean => {
  if (path.isIdentifier()) {
    return isIdentifierReferencesMutated(path);
  }

  let mutated = false;
  path.traverse({
    Identifier(innerPath) {
      const result = isIdentifierReferencesMutated(path);
      if (result) {
        mutated = true;
        // No need to keep traversing - let's stop!
        innerPath.stop();
      }
    },
  });

  return mutated;
};

/**
 * Will try to statically evaluate the node.
 * If successful it will return a literal node,
 * else it will return the fallback node.
 *
 * @param node Node to evaluate
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 * @param fallbackNode Optional node to return if evaluation is not successful. Defaults to `node`.
 */
const babelEvaluateExpression = (
  node: t.Expression,
  meta: Metadata,
  fallbackNode: t.Expression = node
): t.Expression => {
  try {
    const path = getPathOfNode(node, meta.parentPath);
    if (isPathReferencingAnyMutatedIdentifiers(path)) {
      return fallbackNode;
    }

    const result = path.evaluate();
    if (result.value != null) {
      switch (typeof result.value) {
        case 'string':
          return t.stringLiteral(result.value);

        case 'number':
          return t.numericLiteral(result.value);
      }
    }

    return fallbackNode;
  } catch {
    return fallbackNode;
  }
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
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 */
export const evaluateExpression = (
  expression: t.Expression,
  meta: Metadata
): ReturnType<typeof createResultPair> => {
  let value: t.Node | undefined | null = undefined;
  let updatedMeta: Metadata = meta;

  // TypeScript AST nodes can be skipped as we don't care about types
  const targetExpression = t.isTSAsExpression(expression) ? expression.expression : expression;

  // --------------
  // NOTE: We are recursively calling evaluateExpression() which is then going to try and evaluate it
  // multiple times. This may or may not be a performance problem - when looking for quick wins perhaps
  // there is something we could do better here.
  // --------------

  if (t.isIdentifier(targetExpression)) {
    ({ value, meta: updatedMeta } = traverseIdentifier(
      targetExpression,
      updatedMeta,
      evaluateExpression
    ));
  } else if (t.isMemberExpression(targetExpression)) {
    ({ value, meta: updatedMeta } = traverseMemberExpression(
      targetExpression,
      updatedMeta,
      evaluateExpression
    ));
  } else if (t.isFunction(targetExpression)) {
    ({ value, meta: updatedMeta } = traverseFunction(
      targetExpression,
      updatedMeta,
      evaluateExpression
    ));
  } else if (t.isCallExpression(targetExpression)) {
    ({ value, meta: updatedMeta } = traverseCallExpression(
      targetExpression,
      updatedMeta,
      evaluateExpression
    ));
  } else if (t.isBinaryExpression(targetExpression)) {
    ({ value, meta: updatedMeta } = traverseBinaryExpression(
      targetExpression,
      updatedMeta,
      evaluateExpression
    ));
  } else if (t.isUnaryExpression(targetExpression)) {
    ({ value, meta: updatedMeta } = traverseUnaryExpression(
      targetExpression,
      updatedMeta,
      evaluateExpression
    ));
  }

  if (
    t.isStringLiteral(value) ||
    t.isNumericLiteral(value) ||
    t.isObjectExpression(value) ||
    t.isTaggedTemplateExpression(value) ||
    // TODO this should be more generic
    (value && isCompiledKeyframesCallExpression(value, updatedMeta.state))
  ) {
    return createResultPair(value, updatedMeta);
  }

  if (value) {
    // If we fail to statically evaluate `value` we will return `expression` instead.
    // It's preferable to use the identifier than its result if it can't be statically evaluated.
    // E.g. say we got the result of an identifier `foo` as `bar()` -- its more preferable to return
    // `foo` instead of `bar()` for a single source of truth.
    const babelEvaluatedNode = babelEvaluateExpression(value, updatedMeta, targetExpression);
    return createResultPair(babelEvaluatedNode, updatedMeta);
  }

  const babelEvaluatedNode = babelEvaluateExpression(targetExpression, updatedMeta);
  return createResultPair(babelEvaluatedNode, updatedMeta);
};
