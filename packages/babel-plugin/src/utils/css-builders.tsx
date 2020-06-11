import * as t from '@babel/types';
import kebabCase from '@compiled/ts-transform-css-in-js/dist/utils/kebab-case';
import { addUnitIfNeeded } from '@compiled/ts-transform-css-in-js/dist/utils/css-property';
import { hash } from '@compiled/ts-transform-css-in-js/dist/utils/hash';
import generate from '@babel/generator';

export interface CSSOutput {
  css: string;
  variables: {
    name: string;
    expression: t.Expression;
  }[];
}

const extractObjectExpression = (node: t.ObjectExpression): CSSOutput => {
  const variables: CSSOutput['variables'] = [];
  let css = '';

  node.properties.forEach((prop) => {
    if (t.isObjectProperty(prop)) {
      const key = prop.key.name;
      let value = '';

      if (t.isStringLiteral(prop.value)) {
        value = prop.value.value;
      } else if (t.isNumericLiteral(prop.value)) {
        value = addUnitIfNeeded(key, prop.value.value);
      } else if (t.isExpression(prop.value)) {
        const variableName = `--var-${hash(generate(prop.value).code)}`;
        variables.push({ name: variableName, expression: prop.value });
        value = `var(${variableName})`;
      } else {
        throw new Error(`Not supported.`);
      }

      css += `${kebabCase(key)}: ${value};`;
    }
  });

  return { css, variables };
};

export const buildCss = (node: t.StringLiteral | t.ObjectExpression): CSSOutput => {
  if (t.isStringLiteral(node)) {
    return { css: node.value, variables: [] };
  }

  if (t.isObjectExpression(node)) {
    return extractObjectExpression(node);
  }

  throw new Error('Unsupported node.');
};
