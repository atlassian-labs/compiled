import * as t from '@babel/types';
import kebabCase from '@compiled/ts-transform-css-in-js/dist/utils/kebab-case';
import { addUnitIfNeeded } from '@compiled/ts-transform-css-in-js/dist/utils/css-property';
import {
  cssAfterInterpolation,
  cssBeforeInterpolation,
} from '@compiled/ts-transform-css-in-js/dist/utils/string-interpolations';
import { hash } from '@compiled/ts-transform-css-in-js/dist/utils/hash';
import generate from '@babel/generator';
import { joinExpressions } from './ast-builders';
import { State } from '../types';

export interface CSSOutput {
  css: string;
  variables: {
    name: string;
    expression: t.Expression;
  }[];
}

const getInterpolation = <TNode extends {}>(expression: TNode | undefined, state: State) => {
  if (t.isIdentifier(expression) && state.declarations) {
    const declaration = state.declarations[expression.name];
    if (t.isVariableDeclaration(declaration) && declaration.kind === 'const') {
      // We only want to pick out variable declarations that are constants
      const potentialValue = declaration.declarations[0].init;
      if (
        t.isStringLiteral(potentialValue) ||
        t.isNumericLiteral(potentialValue) ||
        t.isObjectExpression(potentialValue)
      ) {
        return potentialValue;
      }
    }
  }

  return expression;
};

const normalizeContentValue = (value: string) => {
  if (value.charAt(0) !== '"' && value.charAt(0) !== "'") {
    return `"${value}"`;
  }

  return value;
};

const extractObjectExpression = (node: t.ObjectExpression, state: State): CSSOutput => {
  let variables: CSSOutput['variables'] = [];
  let css = '';

  node.properties.forEach((prop) => {
    if (t.isObjectProperty(prop)) {
      // Don't use prop.value directly as it extracts constants from identifiers if needed.
      const propValue = getInterpolation(prop.value, state);
      const key = prop.key.name || prop.key.value;
      let value = '';

      if (t.isStringLiteral(propValue)) {
        value = key === 'content' ? normalizeContentValue(propValue.value) : propValue.value;
      } else if (t.isNumericLiteral(propValue)) {
        value = addUnitIfNeeded(key, propValue.value);
      } else if (t.isObjectExpression(propValue)) {
        const result = extractObjectExpression(propValue, state);
        css += `${key} { ${result.css} }`;
        variables = variables.concat(result.variables);
        return;
      } else if (t.isTemplateLiteral(propValue)) {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const result = extractTemplateLiteral(propValue, state);
        value = result.css;
        variables = variables.concat(result.variables);
      } else if (t.isExpression(propValue)) {
        const variableName = `--var-${hash(generate(propValue).code)}`;
        variables.push({ name: variableName, expression: propValue });
        value = `var(${variableName})`;
      } else {
        throw new Error(`Not supported.`);
      }

      css += `${kebabCase(key)}: ${value};`;
    } else if (t.isSpreadElement(prop) && t.isIdentifier(prop.argument)) {
      const declaration = (state.declarations || {})[prop.argument.name];
      if (
        t.isVariableDeclaration(declaration) &&
        t.isObjectExpression(declaration.declarations[0].init)
      ) {
        // The declaration is in this module - let's use it!
        const declarationValue = declaration.declarations[0].init;
        const result = extractObjectExpression(declarationValue, state);
        css += result.css;
        variables = variables.concat(result.variables);
        return;
      } else {
        throw new Error(`Declaration for ${prop.argument.name} could not be found.`);
      }
    }
  });

  return { css, variables };
};

const extractTemplateLiteral = (node: t.TemplateLiteral, state: State): CSSOutput => {
  let variables: CSSOutput['variables'] = [];
  const css = node.quasis.reduce((css, q, index) => {
    const interpolation = getInterpolation(node.expressions[index], state);

    if (t.isStringLiteral(interpolation) || t.isNumericLiteral(interpolation)) {
      return css + q.value.raw + interpolation.value;
    }

    if (t.isObjectExpression(interpolation)) {
      const result = extractObjectExpression(interpolation, state);
      variables = variables.concat(result.variables);
      return css + result.css;
    }

    if (interpolation) {
      const variableName = `--var-${hash(generate(interpolation).code)}`;
      const nextQuasis = node.quasis[index + 1];
      const before = cssBeforeInterpolation(css + q.value.raw);
      const after = cssAfterInterpolation(nextQuasis.value.raw);
      let expression: t.Expression =
        before.variablePrefix || after.variableSuffix
          ? // When there is a prefix/suffix we want to ensure the interpolation at least
            // resolves to an empty string - so we short circuit it to one.
            t.logicalExpression('||', interpolation, t.stringLiteral(''))
          : interpolation;

      if (before.variablePrefix) {
        expression = joinExpressions(t.stringLiteral(before.variablePrefix), expression, null);
      }

      if (after.variableSuffix) {
        expression = joinExpressions(expression, t.stringLiteral(after.variableSuffix), null);
      }

      nextQuasis.value.raw = after.css; // Removes any suffixes from the next quasis.
      variables.push({ name: variableName, expression });

      return before.css + `var(${variableName})`;
    }

    return css + q.value.raw;
  }, '');

  return { css, variables };
};

export const buildCss = (
  node: t.StringLiteral | t.TemplateLiteral | t.ObjectExpression,
  state: State
): CSSOutput => {
  if (t.isStringLiteral(node)) {
    return { css: node.value, variables: [] };
  }

  if (t.isTemplateLiteral(node)) {
    return extractTemplateLiteral(node, state);
  }

  if (t.isObjectExpression(node)) {
    return extractObjectExpression(node, state);
  }

  throw new Error('Unsupported node.');
};
