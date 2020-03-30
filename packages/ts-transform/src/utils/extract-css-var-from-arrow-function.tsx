import * as ts from 'typescript';
import { CssVariableExpressions } from '../types';
import { hash } from './sequential-chars';

export const extractCssVarFromArrowFunction = (
  node: ts.ArrowFunction,
  _: ts.TransformationContext
): CssVariableExpressions => {
  const body: ts.Expression = (ts.isParenthesizedExpression(node.body)
    ? node.body.expression
    : node.body) as any;
  const cssVariableName = hash(body.getText());

  return { expression: body, name: `--var-${cssVariableName}` };
};
