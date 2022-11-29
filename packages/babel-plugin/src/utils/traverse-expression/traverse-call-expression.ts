import * as t from '@babel/types';

import type { Metadata } from '../../types';
import { getPathOfNode, wrapNodeInIIFE } from '../ast';
import { createResultPair } from '../create-result-pair';
import { resolveBinding } from '../resolve-binding';
import type { EvaluateExpression } from '../types';

/**
 * Will find the function node for the call expression and wrap an IIFE around it (to avoid name collision)
 * and move all the parameters mapped to passed arguments in the IIFE's scope (own scope in this case).
 * It will also set own scope path so that when we recursively evaluate any node,
 * we will look for its binding in own scope first, then parent scope.
 *
 * @param expression Expression we want to interrogate.
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 */
export const traverseCallExpression = (
  expression: t.CallExpression,
  meta: Metadata,
  evaluateExpression: EvaluateExpression
): ReturnType<typeof createResultPair> => {
  const callee = expression.callee;
  let value: t.Node | undefined | null = undefined;
  // Make sure updatedMeta is a new object, so that when the ownPath is set, the meta does not get re-used incorrectly in
  // later parts of the AST
  let updatedMeta: Metadata = { ...meta };

  /*
      Basically flow is as follows:
      1. Get the calling function node. It can be either identifier `func('arg')` or a
         member expression `x.func('arg')`;
      2. Save the reference of function node for example `func`.
      3. Pull out its parameters.
      4. Evaluate the args of calling function `func('arg')` by traversing recursively.
      5. Loop through params, and map the args with params.
      6. Pull the params and create an IIFE around the calling function `CallExpression` which creates
         a new scope around calling function and isolates everything (We add bindings at this step by pushing into its scope).
      7. Add that IIFE node path to `ownPath`, and check only for own binding in `resolveBindingNode` function
         so that only isolated params are evaluated.
      8. In `resolveBindingNode`, if `ownPath` is not set (module traversal case or any other case), it will pick things from `parentPath`.
    */
  if (t.isExpression(callee)) {
    let functionNode;

    if (t.isFunction(callee)) {
      functionNode = callee;
    } else {
      // Get func node either from `Identifier` i.e. `func('arg')` or `MemberExpression` i.e. `x.func('arg')`.
      // Right now we are only supported these 2 flavors. If we have complex case like `func('arg').fn().variable`,
      // it will not get evaluated.
      if (t.isIdentifier(callee)) {
        const resolvedBinding = resolveBinding(callee.name, updatedMeta, evaluateExpression);

        if (resolvedBinding && resolvedBinding.constant) {
          functionNode = resolvedBinding.node;
        }
      } else if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) {
        // Keep a reference of old property because we need to change it back if `callee` cannot be evaluated.
        const oldProperty = callee.property;

        // Convert the last property of the member to a call expression so we attach
        // the functions arguments
        // i.e. change `foo.bar` to `foo.bar('arg')`
        const newProperty = t.callExpression(callee.property, expression.arguments);
        callee.property = newProperty;

        const evaluated = evaluateExpression(callee, updatedMeta);

        // If callee cannot be evulated, `expression` has double call expression. i.e. `x.func('arg')('arg')`
        // So we need to change `callee.property` back to Identifier
        if (evaluated.value === callee) {
          callee.property = oldProperty;
        }

        return evaluated;
      }
    }

    // Check if it is resolved
    if (functionNode && t.isFunction(functionNode)) {
      // Pull its parameters
      const { params } = functionNode;

      // Evaluate the passed args recursively
      const evaluatedArguments = expression.arguments.map(
        (argument) => evaluateExpression(argument as t.Expression, updatedMeta).value
      );

      // Get path of the call expression `func('arg')` or `x.func('arg')`
      const expressionPath = getPathOfNode(expression, updatedMeta.parentPath);
      // Create an IIFE around it and replace its path. So `func('arg')` will become `(() => func('arg'))()`
      // and `x.func('arg')` will become `(() => x.func('arg'))()`.
      // `wrappingNodePath` is the path above.
      const [wrappingNodePath] = expressionPath.replaceWith(wrapNodeInIIFE(expression));

      // Get arrowFunctionExpressionPath, which was created using the IIFE
      const arrowFunctionExpressionPath = getPathOfNode(
        wrappingNodePath.node.callee,
        wrappingNodePath as any
      );

      // Loop through the parameters. Right now only identifier `param` and object pattern `{ param }` or `{ param: p }`
      // are supported.
      params
        .filter((param) => t.isIdentifier(param) || t.isObjectPattern(param))
        .forEach((param, index) => {
          const evaluatedArgument = evaluatedArguments[index];

          // Push evaluated args and params in the IIFE's scope by created a local variable
          // `const param = 'evaluated arg value'`
          arrowFunctionExpressionPath.scope.push({
            id: param,
            init: evaluatedArgument,
            kind: 'const',
          });
        });

      // Set the `ownPath` which `resolveBindingNode` will use to check own binding for the
      // local variables we created above.
      updatedMeta.ownPath = arrowFunctionExpressionPath;
    }

    ({ value, meta: updatedMeta } = evaluateExpression(callee, updatedMeta));
  }

  return createResultPair(value as t.Expression, updatedMeta);
};
