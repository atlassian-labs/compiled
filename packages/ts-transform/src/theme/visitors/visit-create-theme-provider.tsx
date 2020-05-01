import ts from 'typescript';
import { TransformerOptions } from '../../types';

export const visitCreateThemeProvider = (
  node: ts.CallExpression | ts.TaggedTemplateExpression,
  context: ts.TransformationContext,
  _: TransformerOptions
): ts.Node => {
  const visitor = (node: ts.Node): ts.Node => {
    return ts.visitEachChild(node, visitor, context);
  };

  return ts.visitNode(node, visitor);
};
