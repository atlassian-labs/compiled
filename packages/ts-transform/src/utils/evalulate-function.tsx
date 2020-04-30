import * as ts from 'typescript';
import { Declarations, ToCssReturnType } from '../types';
import { objectLiteralToCssString } from './object-literal-to-css';
import { templateLiteralToCss } from './template-literal-to-css';
import { createNodeError } from './ast-node';

export const isReturnCssLike = (
  node: ts.Expression | ts.FunctionDeclaration | ts.BindingElement
): node is ts.ArrowFunction => {
  if (ts.isArrowFunction(node)) {
    const functionBody = ts.isParenthesizedExpression(node.body) ? node.body.expression : node.body;
    return (
      ts.isObjectLiteralExpression(functionBody) ||
      ts.isTemplateLiteral(functionBody) ||
      ts.isNoSubstitutionTemplateLiteral(functionBody) ||
      ts.isStringLiteral(functionBody)
    );
  }

  if (ts.isFunctionDeclaration(node) && node.body) {
    const firstStatement = node.body.statements[0];
    if (
      firstStatement &&
      ts.isReturnStatement(firstStatement) &&
      firstStatement.expression &&
      (ts.isObjectLiteralExpression(firstStatement.expression) ||
        ts.isTemplateLiteral(firstStatement.expression))
    ) {
      return true;
    }
  }

  return false;
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
  node: ts.ArrowFunction | ts.FunctionDeclaration,
  collectedDeclarations: Declarations,
  context: ts.TransformationContext
): ToCssReturnType => {
  if (ts.isArrowFunction(node)) {
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
  }

  if (ts.isFunctionDeclaration(node) && node.body) {
    const firstStatement = node.body.statements[0];

    if (firstStatement && ts.isReturnStatement(firstStatement) && firstStatement.expression) {
      if (ts.isObjectLiteralExpression(firstStatement.expression)) {
        return objectLiteralToCssString(firstStatement.expression, collectedDeclarations, context);
      }

      if (
        ts.isTemplateLiteral(firstStatement.expression) ||
        ts.isNoSubstitutionTemplateLiteral(firstStatement.expression) ||
        ts.isStringLiteral(firstStatement.expression)
      ) {
        return templateLiteralToCss(firstStatement.expression, collectedDeclarations, context);
      }
    }
  }

  throw createNodeError('function body not supported', node);
};
