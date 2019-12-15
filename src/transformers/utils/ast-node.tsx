import * as ts from 'typescript';

export const getExpressionText = (node: ts.Expression) => {
  if (!ts.isStringLiteral(node)) {
    throw new Error('expression isnt a string literal');
  }

  return (node as ts.StringLiteral).text;
};

export const getIdentifierText = (
  node: ts.PropertyName | ts.BindingName | ts.Expression
): string => {
  return (node as ts.Identifier).escapedText as string;
};
