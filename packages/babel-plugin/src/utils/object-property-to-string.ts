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

type StringConcatExpression = t.Expression & {
  callee: t.MemberExpression & {
    computed: false;
    object: t.StringLiteral;
    property: t.Identifier & { name: 'concat' };
  };
  arguments: t.Expression[];
};

const isStringConcatExpression = (
  expression: t.Expression
): expression is StringConcatExpression => {
  if (!t.isCallExpression(expression)) return false;
  const callee = expression.callee;

  if (
    t.isMemberExpression(callee) &&
    callee.computed === false &&
    t.isStringLiteral(callee.object) &&
    t.isIdentifier(callee.property) &&
    callee.property.name === 'concat' &&
    typeof expression.arguments?.length === 'number'
  ) {
    return true;
  }

  return false;
};

/**
 * Determines if we think we can deeply and statically concatenate the arguments of a `"text ".concat('…')` call.
 *
 * For example, `"8px ".concat(' var(--ds-space-050)', ' var(--ds-space-100)')` might be output
 * by Babel and statically concatenated to `"8px var(--ds-space-050) var(--ds-space-100)"`.
 */
export const canBeStaticallyConcatenated = (
  expression: t.Expression
): expression is StringConcatExpression & boolean => {
  if (!isStringConcatExpression(expression)) return false;

  const args = expression.arguments;
  if (!args.length) return true;

  // We only attempt to statically concatenate these specific arguments (though more types may be viable)
  return args.every((arg) => {
    // Example: `'b`' in `"a".concat('b', 'c')``
    if (t.isStringLiteral(arg) || t.isNumericLiteral(arg)) return true;

    // Example: `${b}` in `"a".concat(`${b}`, 'c')` where `b` is static, eg. `const b = 'b'`
    if (t.isTemplateLiteral(arg)) return true;

    return false;
  });
};

/**
 * Attempts to statically concatenate the arguments of a `"text ".concat('…')` call.
 *
 * For example, `"8px ".concat(' var(--ds-space-050)', ' var(--ds-space-100)')` might be output
 * by Babel and this will statically concatenate it to `"8px var(--ds-space-050) var(--ds-space-100)"`.
 */
const concatToString = (
  expression: StringConcatExpression,
  meta: Metadata,
  expressionToString: ExpressionToString
): string => {
  const callee = expression.callee;
  const args = expression.arguments;
  if (!args.length) return callee.object.value;

  return args.reduce<string>((acc, arg) => {
    if (!t.isExpression(arg)) {
      // NOTE: We cannot concatenate this expression, however `canBeStaticallyConcatenated(…)` should catch this.
      throw new Error(`Cannot concatenate an expression with non-expression arguments`);
    }

    return acc + expressionToString(arg, meta);
  }, callee.object.value);
};

export const expressionToString: ExpressionToString = (expression, meta) => {
  // handles {'key-name': 'value'} or {1: 'value'}
  if (t.isStringLiteral(expression) || t.isNumericLiteral(expression)) {
    return String(expression.value);
  }
  // handles {[key]: 'value'} and {[key.key]: 'value'}]}
  if (t.isIdentifier(expression) || t.isMemberExpression(expression)) {
    const evaluatedExpression = evaluateExpression(expression, meta);
    if (evaluatedExpression.value === expression) {
      throw new Error(
        `Cannot statically evaluate the value of "${
          t.isIdentifier(expression) ? expression.name : expression.type
        }`
      );
    }

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

  if (t.isCallExpression(expression) && canBeStaticallyConcatenated(expression)) {
    return concatToString(expression, meta, expressionToString);
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
