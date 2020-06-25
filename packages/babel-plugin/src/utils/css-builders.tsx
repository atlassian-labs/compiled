import * as t from '@babel/types';
import kebabCase from '@compiled/ts-transform-css-in-js/dist/utils/kebab-case';
import { addUnitIfNeeded } from '@compiled/ts-transform-css-in-js/dist/utils/css-property';
import { hash } from '@compiled/ts-transform-css-in-js/dist/utils/hash';
import generate from '@babel/generator';
import { State } from '../types';

export interface CSSOutput {
  css: string;
  variables: {
    name: string;
    expression: t.Expression;
  }[];
}

const getPropValue = (prop: t.ObjectProperty, state: State) => {
  if (state.declarations && t.isIdentifier(prop.value) && state.declarations[prop.value.name]) {
    const declaration = state.declarations[prop.value.name];
    if (!t.isVariableDeclaration(declaration) || declaration.kind !== 'const') {
      return prop.value;
    }

    return declaration.declarations[0].init;
  }

  return prop.value;
};

const extractObjectExpression = (node: t.ObjectExpression, state: State): CSSOutput => {
  const variables: CSSOutput['variables'] = [];
  let css = '';

  node.properties.forEach((prop) => {
    if (t.isObjectProperty(prop)) {
      // Don't use prop.value directly as it extracts constants from identifiers if needed.
      const propValue = getPropValue(prop, state);
      const key = prop.key.name;
      let value = '';

      if (t.isStringLiteral(propValue)) {
        value = propValue.value;
      } else if (t.isNumericLiteral(propValue)) {
        value = addUnitIfNeeded(key, propValue.value);
      } else if (t.isExpression(propValue)) {
        const variableName = `--var-${hash(generate(propValue).code)}`;
        variables.push({ name: variableName, expression: propValue });
        value = `var(${variableName})`;
      } else {
        throw new Error(`Not supported.`);
      }

      css += `${kebabCase(key)}: ${value};`;
    }
  });

  return { css, variables };
};

export const buildCss = (node: t.StringLiteral | t.ObjectExpression, state: State): CSSOutput => {
  if (t.isStringLiteral(node)) {
    return { css: node.value, variables: [] };
  }

  if (t.isObjectExpression(node)) {
    return extractObjectExpression(node, state);
  }

  throw new Error('Unsupported node.');
};
