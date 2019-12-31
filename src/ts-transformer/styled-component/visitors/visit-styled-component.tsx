import ts from 'typescript';
import { createJsxElement } from '../../utils/create-jsx-element';
import { objectLiteralToCssString } from '../../utils/object-literal-to-css';

export const visitObjectStyledComponent = (
  node: ts.CallExpression,
  context: ts.TransformationContext
): ts.Node => {
  if (!ts.isPropertyAccessExpression(node.expression)) {
    throw new Error('expected property access');
  }

  const tagNode = node.expression.name.escapedText as string;
  const [objectLiteral] = node.arguments;
  if (!ts.isObjectLiteralExpression(objectLiteral)) {
    throw new Error('expected object literal');
  }

  const result = objectLiteralToCssString(objectLiteral, {}, context);

  const newElement = createJsxElement(
    tagNode,
    {
      ...result,
      originalNode: node,
      children: ts.createJsxExpression(undefined, ts.createIdentifier('props.children')),
    },
    node
  );

  return ts.createArrowFunction(
    undefined,
    undefined,
    [
      ts.createParameter(
        undefined,
        undefined,
        undefined,
        ts.createIdentifier('props'),
        undefined,
        undefined,
        undefined
      ),
    ],
    undefined,
    ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    newElement
  );
};
