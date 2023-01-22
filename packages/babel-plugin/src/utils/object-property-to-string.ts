import * as t from '@babel/types';

import type { Metadata } from '../types';

import { evaluateExpression } from './evaluate-expression';

type ExpressionToString = (expression: t.Expression | t.PrivateName, meta: Metadata) => string;

const templateLiteralToString = (
  template: t.TemplateLiteral,
  meta: Metadata,
  expressionToString: ExpressionToString
) => {
  let result = '';

  for (let i = 0; i < template.quasis.length; i += 1) {
    result += template.quasis[i].value.raw;

    if (i < template.expressions.length) {
      const expression = template.expressions[i];
      if (t.isTSType(expression)) {
        // Passed a type instead of a value
        // e.g. `${any}`
        throw new Error(`${template.type} has a type instead of a value`);
      }
      const evaluatedExpression = evaluateExpression(expression, meta);
      result += expressionToString(evaluatedExpression.value, evaluatedExpression.meta);
    }
  }

  return result;
};

const binaryExpressionToString = (
  expression: t.BinaryExpression,
  meta: Metadata,
  expressionToString: ExpressionToString
): string => {
  const { left, right, operator } = expression;

  if (operator === '+' && t.isExpression(left)) {
    const leftValue = expressionToString(left, meta);
    const rightValue = expressionToString(right, meta);

    return `${leftValue}${rightValue}`;
  }

  throw new Error(`Cannot use ${operator} for string operation. Use + for string concatenation`);
};

const expressionToString: ExpressionToString = (expression, meta) => {
  // handles {'key-name': 'value'} or {1: 'value'}
  if (t.isStringLiteral(expression) || t.isNumericLiteral(expression)) {
    return String(expression.value);
  }
  // handles {[key]: 'value'}
  if (t.isIdentifier(expression)) {
    const evaluatedExpression = evaluateExpression(expression, meta);

    return expressionToString(evaluatedExpression.value, evaluatedExpression.meta);
  }
  // handles {[`key-${name}`]: 'value'}
  if (t.isTemplateLiteral(expression)) {
    return templateLiteralToString(expression, meta, expressionToString);
  }
  // handles {['key-' + name]: 'value'}
  if (t.isBinaryExpression(expression)) {
    return binaryExpressionToString(expression, meta, expressionToString);
  }

  throw new Error(`${expression.type} has no name.'`);
};

/**
 * Returns string output of a ObjectProperty's key
 *
 * @param prop ObjectProperty expression
 * @param meta Metadata
 */
export const objectPropertyToString = (prop: t.ObjectProperty, meta: Metadata): string => {
  const { computed, key } = prop;
  // handles {key: 'value'}
  if (t.isIdentifier(key) && !computed) {
    return key.name;
  }

  return expressionToString(key, meta);
};
