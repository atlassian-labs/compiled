import * as t from '@babel/types';
import kebabCase from '@compiled/ts-transform-css-in-js/dist/utils/kebab-case';
import { addUnitIfNeeded } from '@compiled/ts-transform-css-in-js/dist/utils/css-property';

const extractObjectExpression = (node: t.ObjectExpression) => {
  let css = '';

  node.properties.forEach((prop) => {
    if (t.isObjectProperty(prop)) {
      const key = prop.key.name;
      let value = '';

      if (t.isStringLiteral(prop.value)) {
        value = prop.value.value;
      } else if (t.isNumericLiteral(prop.value)) {
        value = addUnitIfNeeded(key, prop.value.value);
      }

      css += `${kebabCase(key)}: ${value};`;
    }
  });

  return css;
};

export const buildCss = (node: t.StringLiteral | t.ObjectExpression): string => {
  if (t.isStringLiteral(node)) {
    return node.value;
  }

  if (t.isObjectExpression(node)) {
    return extractObjectExpression(node);
  }

  throw new Error('Unsupported node.');
};
