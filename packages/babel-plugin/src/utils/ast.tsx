import * as t from '@babel/types';

/**
 * Returns the binding identifier for a member expression.
 * For example the member expression `foo.bar.baz` will return the `foo` identifier.
 *
 * @param expression - Member expression node.
 */
export const getMemberExpressionIdentifier = (expression: t.MemberExpression): t.Identifier => {
  let next: t.Expression = expression.object;

  while (next) {
    if (t.isIdentifier(next)) {
      return next;
    }

    if (t.isMemberExpression(next)) {
      next = next.object;
    }
  }

  throw new Error();
};

/**
 * Will return the whole path of a member expression.
 * For example the member expression `foo.bar.baz` will return `['foo', 'bar', 'baz']`.
 *
 * @param expression - Member expression node.
 */
export const getMemberExpressionPath = (expression: t.MemberExpression): string[] => {
  const path: string[] = [];
  let next: t.Expression = expression;

  while (next) {
    if (t.isIdentifier(next.property)) {
      path.splice(0, 0, next.property.name);
    }

    if (t.isMemberExpression(next.object)) {
      next = next.object;
    } else if (t.isIdentifier(next.object)) {
      path.splice(0, 0, next.object.name);
      return path;
    } else {
      return path;
    }
  }

  return path;
};

/**
 * Will return the value of a path from an object expression.
 *
 * For example if  we take an object expression that looks like:
 * ```
 * { colors: { primary: 'red' } }
 * ```
 *
 * And a path that looks like:
 * ```
 * ['colors', 'primary']
 * ```
 *
 * Would result in returning the `red` string literal node.
 * If the value is not found `undefined` will be returned.
 *
 * @param expression - Member expression node.
 * @param path - Path string array.
 */
export const getValueFromObjectExpression = (
  expression: t.ObjectExpression,
  path: string[]
): t.Node | undefined => {
  path = path;
  let props = expression.properties;

  while (path.length > 1) {
    const keyName = path.shift();

    for (let i = 0; i < props.length; i++) {
      const prop = props[i];
      if (
        t.isObjectProperty(prop) &&
        t.isIdentifier(prop.key) &&
        prop.key.name === keyName &&
        t.isObjectExpression(prop.value)
      ) {
        props = prop.value.properties;
        break;
      }
    }
  }

  const keyName = path.shift();

  for (let i = 0; i < props.length; i++) {
    const prop = props[i];
    if (t.isObjectProperty(prop) && t.isIdentifier(prop.key) && prop.key.name === keyName) {
      return prop.value;
    }
  }

  return undefined;
};
