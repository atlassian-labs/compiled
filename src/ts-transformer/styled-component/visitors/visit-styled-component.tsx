import ts from 'typescript';
import { createJsxElement } from '../../utils/create-jsx-element';
import { objectLiteralToCssString } from '../../utils/object-literal-to-css';
import { templateLiteralToCss } from '../../utils/template-literal-to-css';
import { VariableDeclarations } from '../../types';
import { joinToJsxExpression } from '../../utils/expression-operators';

const getTagName = (node: ts.CallExpression | ts.TaggedTemplateExpression): string => {
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
    return node.expression.name.text;
  }

  if (ts.isTaggedTemplateExpression(node) && ts.isPropertyAccessExpression(node.tag)) {
    return node.tag.name.text;
  }

  throw new Error('tag should have been here');
};

const getObjectLiteralOrTemplateLiteral = (
  node: ts.CallExpression | ts.TaggedTemplateExpression
): ts.ObjectLiteralExpression | ts.TemplateExpression | ts.NoSubstitutionTemplateLiteral => {
  if (ts.isCallExpression(node)) {
    const firstArgument = node.arguments[0];
    if (ts.isObjectLiteralExpression(firstArgument)) {
      return firstArgument;
    }

    throw new Error('only object allowed as first argument');
  }

  return node.template;
};

export const visitStyledComponent = (
  node: ts.CallExpression | ts.TaggedTemplateExpression,
  context: ts.TransformationContext,
  collectedDeclarations: VariableDeclarations
): ts.Node => {
  const tagName = getTagName(node);
  const dataToTransform = getObjectLiteralOrTemplateLiteral(node);

  const result = ts.isObjectLiteralExpression(dataToTransform)
    ? objectLiteralToCssString(dataToTransform, collectedDeclarations, context)
    : templateLiteralToCss(dataToTransform, collectedDeclarations, context);

  const newElement = createJsxElement(
    tagName,
    {
      ...result,
      originalNode: node,
      classNameFactory: className =>
        joinToJsxExpression(className, ts.createIdentifier('props.className'), {
          conditional: true,
        }),
      jsxAttributes: [ts.createJsxSpreadAttribute(ts.createIdentifier('props'))],
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
