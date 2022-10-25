import * as t from '@babel/types';

export const isEmptyValue = (expression: t.Expression): boolean =>
  t.isIdentifier(expression, { name: 'undefined' }) ||
  t.isNullLiteral(expression) ||
  t.isStringLiteral(expression, { value: '' });
