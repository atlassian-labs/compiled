import * as t from '@babel/types';

export const hasNumericValue = (expression: t.Expression): boolean =>
  t.isNumericLiteral(expression) ||
  (t.isStringLiteral(expression) && !Number.isNaN(Number(expression.value)));
