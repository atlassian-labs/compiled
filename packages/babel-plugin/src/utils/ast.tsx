import * as t from '@babel/types';

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

export const getValueFromObjectExpression = (
  expression: t.ObjectExpression,
  path: string[]
): t.Node | null => {
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

  return null;
};
