import * as ts from 'typescript';
import { CssVariableExpressions } from '../types';
import { nextCssVariableName } from './identifiers';
import { createNodeError } from './ast-node';

/**
 * This expects a simple arrow function like the following:
 * `props => props.color`
 */
export const extractCssVarFromArrowFunction = (
  node: ts.ArrowFunction,
  context: ts.TransformationContext
): CssVariableExpressions => {
  let expression: ts.Expression = ts.createIdentifier('');
  let name: string = '';
  const body = ts.isParenthesizedExpression(node.body) ? node.body.expression : node.body;

  if (ts.isPropertyAccessExpression(body)) {
    // We are returning a property immediately.
    name = body.name.escapedText.toString();
    // This changes props.color into an identifier instead.
    // Technically this isn't right - we'll have to fix it sometime.
    expression = ts.createIdentifier(body.getText());
  } else if (ts.isTemplateExpression(body)) {
    // TODO: Handle multiple expressions.
    body.templateSpans.forEach(span => {
      if (ts.isPropertyAccessExpression(span.expression)) {
        name = span.expression.name.escapedText.toString();
      }
    });

    expression = body;
  } else {
    throw createNodeError('unsupported arrow function body', node);
  }

  return { expression, name: `--${name}-${nextCssVariableName()}` };
};
