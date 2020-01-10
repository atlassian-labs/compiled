import * as ts from 'typescript';
import { VariableDeclarations, ToCssReturnType } from '../types';
import { objectLiteralToCssString } from './object-literal-to-css';
import { templateLiteralToCss } from './template-literal-to-css';

export const isReturnCssLike = (node: ts.Expression): node is ts.ArrowFunction => {
  if (!ts.isArrowFunction(node)) {
    return false;
  }

  const functionBody = ts.isParenthesizedExpression(node.body) ? node.body.expression : node.body;
  return (
    ts.isObjectLiteralExpression(functionBody) ||
    ts.isTemplateLiteral(functionBody) ||
    ts.isNoSubstitutionTemplateLiteral(functionBody) ||
    ts.isStringLiteral(functionBody)
  );
};

/**
 * Will "evaluate" a function and return its CSS representation.
 * NB: It's not really evaluating it tbh in a runtime sense.
 * Will only work for arrow functions like this atm:
 *
 * () => ({})
 * () => ``
 * () => ''
 */
export const evaluateFunction = (
  node: ts.Expression,
  collectedDeclarations: VariableDeclarations,
  context: ts.TransformationContext
): ToCssReturnType => {
  if (!ts.isArrowFunction(node)) {
    throw new Error('only can eval arrow funcs atm');
  }

  const functionBody = ts.isParenthesizedExpression(node.body) ? node.body.expression : node.body;
  if (ts.isObjectLiteralExpression(functionBody)) {
    return objectLiteralToCssString(functionBody, collectedDeclarations, context);
  }

  if (
    ts.isTemplateLiteral(functionBody) ||
    ts.isNoSubstitutionTemplateLiteral(functionBody) ||
    ts.isStringLiteral(functionBody)
  ) {
    return templateLiteralToCss(functionBody, collectedDeclarations, context);
  }

  throw 'function body not supported';
};
