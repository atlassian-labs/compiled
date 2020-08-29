import * as t from '@babel/types';
import traverse, { NodePath } from '@babel/traverse';
import { Metadata } from '../types';

/**
 * Returns the nodes path including the scope of a parent.
 * @param node
 * @param parentPath
 */
export const getPathOfNode = <TNode extends {}>(
  node: TNode,
  parentPath: NodePath
): NodePath<TNode> => {
  let foundPath: NodePath | null = null;

  traverse(
    t.expressionStatement(node as any),
    {
      enter(path) {
        foundPath = path;
        path.stop();
      },
    },
    parentPath.scope,
    undefined,
    parentPath
  );

  if (!foundPath) {
    throw new Error();
  }

  return foundPath;
};

/**
 * Returns the binding identifier for a member expression.
 * For example the member expression `foo.bar.baz` will return the `foo` identifier.
 *
 * @param expression - Member expression node.
 */
export const getMemberExpressionMeta = (expression: t.MemberExpression) => {
  let bindingIdentifier: t.Identifier | null = null;
  const accessPath: t.Identifier[] = [];

  if (t.isIdentifier(expression.property)) {
    accessPath.push(expression.property);
  }

  traverse(t.expressionStatement(expression), {
    noScope: true,
    MemberExpression(path) {
      if (t.isIdentifier(path.node.object)) {
        bindingIdentifier = path.node.object;
      }

      if (t.isIdentifier(path.node.property)) {
        accessPath.push(path.node.property);
      }
    },
  });

  return {
    bindingIdentifier: bindingIdentifier!,
    accessPath: accessPath.reverse(),
  };
};

/**
 * Will return the value of a path from an object expression.
 *
 * For example if  we take an object expression that looks like:
 * ```
 * { colors: { primary: 'red' } }
 * ```
 *
 * And a path of identifiers that looks like:
 * ```
 * [colors, primary]
 * ```
 *
 * Would result in returning the `red` string literal node.
 * If the value is not found `undefined` will be returned.
 *
 * @param expression - Member expression node.
 * @param accessPath - Access path identifiers.
 */
export const getValueFromObjectExpression = (
  expression: t.ObjectExpression,
  accessPath: t.Identifier[]
): t.Node | undefined => {
  let value: t.Node | undefined = undefined;

  traverse(expression, {
    noScope: true,
    ObjectProperty(path) {
      if (t.isIdentifier(path.node.key, { name: accessPath[0].name })) {
        if (t.isObjectExpression(path.node.value)) {
          value = getValueFromObjectExpression(path.node.value, accessPath.slice(1));
        } else {
          value = path.node.value;
        }

        path.stop();
      }
    },
  });

  return value;
};

/**
 * Will return either the name of an identifier or the value of a string literal.
 *
 * E.g:
 * - `foo` identifier node will return `"foo"`,
 * - `"bar"` string literal node will return `"bar"`.
 *
 * @param node
 */
export const getKey = (node: t.Expression) => {
  if (t.isIdentifier(node)) {
    return node.name;
  }

  if (t.isStringLiteral(node)) {
    return node.value;
  }

  throw new Error();
};

/**
 * Will recursively traverse a path and its identifiers to find all bindings.
 * If any of those bindings are mutable `true` will be returned.
 * Else `false`.
 *
 * @param path
 */
export const doesPathReferenceAnyMutableIdentifiers = (path: NodePath<any>): boolean => {
  if (path.isIdentifier()) {
    const binding = path.scope.getBinding(path.node.name);
    if (!binding || !t.isVariableDeclarator(binding.path.node) || binding.kind !== 'const') {
      return true;
    }

    return doesPathReferenceAnyMutableIdentifiers(
      getPathOfNode(binding.path.node.init as t.Expression, binding.path)
    );
  }

  let mutable = false;
  path.traverse({
    Identifier(innerPath) {
      const result = doesPathReferenceAnyMutableIdentifiers(innerPath);
      if (result) {
        mutable = true;
        // No need to keep traversing - let's stop!
        innerPath.stop();
      }
    },
  });

  return mutable;
};

/**
 * Will try to evaluate the expression.
 * If successful it will return a literal node,
 * else it will return the original expression.
 */
export const tryEvaluateExpression = (node: t.Expression, meta: Metadata) => {
  if (!node || !t.isExpression(node)) {
    return node;
  }

  const path = getPathOfNode(node, meta.parentPath);
  if (doesPathReferenceAnyMutableIdentifiers(path)) {
    return node;
  }

  const result = path.evaluate();
  if (result.value) {
    switch (typeof result.value) {
      case 'string':
        return t.stringLiteral(result.value);

      case 'number':
        return t.numericLiteral(result.value);
    }
  }

  return node;
};

/**
 * Will look in an expression and return the actual value.
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
export const getInterpolation = (expression: t.Expression, meta: Metadata) => {
  let value: t.Node | undefined | null = undefined;

  if (t.isIdentifier(expression)) {
    const binding = meta.parentPath.scope.getBinding(expression.name);
    if (binding && binding.kind === 'const' && t.isVariableDeclarator(binding.path.node)) {
      value = binding.path.node.init;
    }
  } else if (t.isMemberExpression(expression)) {
    const { accessPath, bindingIdentifier } = getMemberExpressionMeta(expression);
    const binding = meta.parentPath.scope.getBinding(bindingIdentifier.name);

    if (
      binding &&
      binding.kind === 'const' &&
      t.isVariableDeclarator(binding.path.node) &&
      t.isObjectExpression(binding.path.node.init)
    ) {
      value = getValueFromObjectExpression(binding.path.node.init, accessPath);
    }
  }

  if (t.isStringLiteral(value) || t.isNumericLiteral(value) || t.isObjectExpression(value)) {
    return value;
  }

  return tryEvaluateExpression(expression, meta);
};

/**
 * Will wrap BlockStatement or Expression in an IIFE,
 * Looks like (() => { return 10; })().
 *
 * @param node Node of type either BlockStatement or Expression
 */
export const wrapNodeInIIFE = (node: t.BlockStatement | t.Expression) =>
  t.callExpression(t.arrowFunctionExpression([], node), []);

const tryWrappingBlockStatementInIIFE = (node: t.BlockStatement | t.Expression) =>
  t.isBlockStatement(node) ? wrapNodeInIIFE(node) : node;

/**
 * Will pick `ArrowFunctionExpression` body and tries to wrap it in an IIFE if
 * its a BlockStatement otherwise returns the picked body,
 * E.g.
 * `props => props.color` would end up as `props.color`.
 * `props => { return props.color` } would end up as `(() => { return props.color })()`.
 *
 * @param node Node of type ArrowFunctionExpression
 */
export const pickArrowFunctionExpressionBody = (node: t.ArrowFunctionExpression) =>
  tryWrappingBlockStatementInIIFE(node.body);
