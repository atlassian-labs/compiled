import ts from 'typescript';
import isPropValid from '@emotion/is-prop-valid';
import { createJsxElement } from '../../utils/create-jsx-element';
import { objectLiteralToCssString } from '../../utils/object-literal-to-css';
import { templateLiteralToCss } from '../../utils/template-literal-to-css';
import { Declarations } from '../../types';
import { joinToJsxExpression } from '../../utils/expression-operators';
import { getIdentifierText } from '../../utils/ast-node';

const getTagName = (node: ts.CallExpression | ts.TaggedTemplateExpression): string => {
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
    return node.expression.name.text;
  }

  if (ts.isTaggedTemplateExpression(node) && ts.isPropertyAccessExpression(node.tag)) {
    return node.tag.name.text;
  }

  throw new Error('tag should have been here');
};

const getPropertyAccessName = (propertyAccess?: string): string => {
  if (!propertyAccess) {
    return '';
  }

  return propertyAccess.indexOf('.') > 0 ? propertyAccess.split('.')[1] : propertyAccess;
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
  collectedDeclarations: Declarations
): ts.Node => {
  const tagName = getTagName(node);
  const dataToTransform = getObjectLiteralOrTemplateLiteral(node);

  const result = ts.isObjectLiteralExpression(dataToTransform)
    ? objectLiteralToCssString(dataToTransform, collectedDeclarations, context)
    : templateLiteralToCss(dataToTransform, collectedDeclarations, context);

  const propsToDestructure = result.cssVariables
    .map(({ expression }) => {
      if (ts.isIdentifier(expression)) {
        // referencing an identifier straight e.g. props.fontSize
        const propName = getPropertyAccessName(expression.text);
        if (!isPropValid(propName)) {
          return propName;
        }
      } else if (ts.isBinaryExpression(expression)) {
        // is an expression e.g. props.fontSize + 'px'
        const propName = getPropertyAccessName(getIdentifierText(expression.left));
        if (!isPropValid(propName)) {
          // ok its not valid. we want to do two things:
          // 1. rename identifier from props.fontSize to fontSize
          expression.left = ts.createIdentifier(propName);
          // 2. destructure fontSize from the props object
          return propName;
        }
      } else if (ts.isTemplateExpression(expression)) {
        // TODO: Handle multiple spans.
        let propName = '';

        expression.templateSpans.forEach(span => {
          if (ts.isPropertyAccessExpression(span.expression)) {
            propName = span.expression.name.escapedText.toString();
            span.expression = ts.createIdentifier(propName);
          }
        });

        return propName;
      }
    })
    .filter(Boolean) as string[];

  const newElement = createJsxElement(
    tagName,
    {
      ...result,
      originalNode: node,
      styleFactory: props => [
        ts.createSpreadAssignment(ts.createIdentifier('props.style')),
        ...props.map(prop => {
          const propName = getPropertyAccessName(getIdentifierText(prop.initializer));
          if (propsToDestructure.includes(propName)) {
            prop.initializer = ts.createIdentifier(propName);
          }
          return prop;
        }),
      ],
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
        propsToDestructure.length
          ? // We want to destructure props so it doesn't contain any invalid html attributes.
            ts.createObjectBindingPattern([
              ...propsToDestructure.map(prop =>
                ts.createBindingElement(undefined, undefined, ts.createIdentifier(prop), undefined)
              ),
              ts.createBindingElement(
                ts.createToken(ts.SyntaxKind.DotDotDotToken),
                undefined,
                ts.createIdentifier('props'),
                undefined
              ),
            ])
          : // They're all valid so we don't need to destructure.
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
