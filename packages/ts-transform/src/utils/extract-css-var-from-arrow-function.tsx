import * as ts from 'typescript';
import { CssVariableExpressions } from '../types';
import { hash } from './sequential-chars';

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
  const cssVariableName = hash(node.body.getText());

  return { expression: bodyExpression, name: `--var-${cssVariableName}` };
};
