import * as ts from 'typescript';

export const getExpressionText = (node: ts.Expression) => {
  return (node as ts.StringLiteral).text;
};
