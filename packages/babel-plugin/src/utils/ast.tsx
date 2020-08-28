import * as t from '@babel/types';
import traverse from '@babel/traverse';
import { State } from '../types';

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
export const getInterpolation = <TNode extends {}>(expression: TNode | undefined, state: State) => {
  if (!state.declarations) {
    return expression;
  }

  let value: t.Node | undefined | null = undefined;

  if (t.isIdentifier(expression)) {
    const binding = state.declarations[expression.name];

    if (t.isVariableDeclaration(binding) && binding.kind === 'const') {
      value = binding.declarations[0].init;
    }
  } else if (t.isMemberExpression(expression)) {
    const { accessPath, bindingIdentifier } = getMemberExpressionMeta(expression);
    const binding = state.declarations[bindingIdentifier.name];

    if (
      t.isVariableDeclaration(binding) &&
      binding.kind === 'const' &&
      t.isObjectExpression(binding.declarations[0].init)
    ) {
      value = getValueFromObjectExpression(binding.declarations[0].init, accessPath);
    }
  }

  if (t.isStringLiteral(value) || t.isNumericLiteral(value) || t.isObjectExpression(value)) {
    return value;
  }

  return expression;
};
