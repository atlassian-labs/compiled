import * as ts from 'typescript';
import { CssVariableExpressions } from '../types';
import { nextCssVariableName } from './identifiers';

/**
 * This expects a simple arrow function like the following:
 * `props => props.color`
 */
export const extractCssVarFromArrowFunction = (
  node: ts.ArrowFunction,
  context: ts.TransformationContext
): CssVariableExpressions => {
  let identifier: ts.Identifier = ts.createIdentifier('');
  let name: string = '';

  const visitor = (node: ts.Node) => {
    if (ts.isPropertyAccessExpression(node)) {
      identifier = ts.createIdentifier(node.getText());
      name = `--${node.name.escapedText}-${nextCssVariableName()}`;
    }

    return node;
  };

  ts.visitEachChild(node, visitor, context);

  return { expression: identifier, name };
};
