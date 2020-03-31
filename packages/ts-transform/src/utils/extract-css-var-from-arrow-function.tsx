import * as ts from 'typescript';
import { CssVariableExpressions } from '../types';
import { cssVariableHash } from './hash';

function wrapInIIFE(body: ts.Block): ts.CallExpression {
  return ts.createCall(
    ts.createParen(
      ts.createArrowFunction(
        undefined,
        undefined,
        [],
        undefined,
        ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        body
      )
    ),
    undefined,
    []
  );
}

export const extractCssVarFromArrowFunction = (
  node: ts.ArrowFunction,
  _: ts.TransformationContext
): CssVariableExpressions => {
  const bodyExpression: ts.Expression = ts.isBlock(node.body) ? wrapInIIFE(node.body) : node.body;
  const cssVariableName = cssVariableHash(node.body);

  return { expression: bodyExpression, name: cssVariableName };
};
