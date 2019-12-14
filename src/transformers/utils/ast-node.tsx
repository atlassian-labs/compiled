import * as ts from 'typescript';

export const getExpressionText = (node: ts.Expression) => {
  if (!ts.isStringLiteral(node)) {
    throw new Error('expression isnt a string literal');
  }

  return (node as ts.StringLiteral).text;
};
