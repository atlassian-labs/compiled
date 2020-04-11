import ts from 'typescript';
import isPropValid from '@emotion/is-prop-valid';
import { createCompiledComponent } from '../../utils/create-jsx-element';
import { objectLiteralToCssString } from '../../utils/object-literal-to-css';
import { templateLiteralToCss } from '../../utils/template-literal-to-css';
import { Declarations } from '../../types';
import { joinToJsxExpression } from '../../utils/expression-operators';
import { getIdentifierText, createNodeError } from '../../utils/ast-node';
import * as constants from '../../constants';

const getTagName = (node: ts.CallExpression | ts.TaggedTemplateExpression): string => {
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
    return node.expression.name.text;
  }

  if (ts.isTaggedTemplateExpression(node) && ts.isPropertyAccessExpression(node.tag)) {
    return node.tag.name.text;
  }

  throw createNodeError('tag should have been here', node);
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

    throw createNodeError('only object allowed as first argument', firstArgument);
  }

  return node.template;
};

export const visitStyledComponent = (
  node: ts.CallExpression | ts.TaggedTemplateExpression,
  context: ts.TransformationContext,
  collectedDeclarations: Declarations
): ts.Node => {
  const originalTagName = getTagName(node);
  const dataToTransform = getObjectLiteralOrTemplateLiteral(node);

  const result = ts.isObjectLiteralExpression(dataToTransform)
    ? objectLiteralToCssString(dataToTransform, collectedDeclarations, context)
    : templateLiteralToCss(dataToTransform, collectedDeclarations, context);

  const propsToDestructure: string[] = [];

  const visitedCssVariables = result.cssVariables.map(cssVarObj => {
    // Expression can be simple (props.color), complex (props.color ? 'blah': 'yeah', or be an IIFE)
    // We need to traverse it to find uses of props.blah and then mark them.
    // We make the assumption that everything accessing props will be "props.blah" because we are lazy.
    // Will add proper behaviour in later! PRs welcome ;).

    const visitor = (node: ts.Node): ts.Node => {
      if (
        ts.isPropertyAccessExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'props' &&
        !isPropValid(node.name.text) &&
        !propsToDestructure.includes(node.name.text)
      ) {
        // We found a "props.foo" access with an invalid prop name.
        // Let's re-write this node to remove the "props".
        propsToDestructure.push(node.name.text);
        return node.name;
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return {
      expression: ts.visitNode(cssVarObj.expression, visitor),
      name: cssVarObj.name,
    };
  });

  const newElement = createCompiledComponent(ts.createIdentifier(constants.STYLED_AS_USAGE_NAME), {
    css: result.css,
    cssVariables: visitedCssVariables,
    node,
    context,
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
    jsxAttributes: [
      // {...props}
      ts.createJsxSpreadAttribute(ts.createIdentifier('props')),

      // ref={ref}
      ts.createJsxAttribute(
        ts.createIdentifier(constants.REF_PROP_NAME),
        ts.createJsxExpression(undefined, ts.createIdentifier(constants.REF_PROP_NAME))
      ),
    ],
  });

  return ts.createCall(
    ts.createPropertyAccess(
      constants.getReactDefaultImportName(context),
      ts.createIdentifier(constants.FORWARD_REF_IMPORT)
    ),
    undefined,
    [
      ts.createArrowFunction(
        undefined,
        undefined,
        [
          ts.createParameter(
            undefined,
            undefined,
            undefined,
            ts.createObjectBindingPattern([
              // a: C = 'div'
              ts.createBindingElement(
                undefined,
                ts.createIdentifier(constants.STYLED_AS_PROP_NAME),
                ts.createIdentifier(constants.STYLED_AS_USAGE_NAME),
                ts.createStringLiteral(originalTagName)
              ),

              ...propsToDestructure.map(prop =>
                ts.createBindingElement(undefined, undefined, ts.createIdentifier(prop), undefined)
              ),

              // ...props
              ts.createBindingElement(
                ts.createToken(ts.SyntaxKind.DotDotDotToken),
                undefined,
                ts.createIdentifier('props'),
                undefined
              ),
            ]),
            undefined,
            undefined,
            undefined
          ),
          ts.createParameter(
            undefined,
            undefined,
            undefined,
            ts.createIdentifier(constants.REF_PROP_NAME),
            undefined,
            undefined,
            undefined
          ),
        ],
        undefined,
        ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        newElement
      ),
    ]
  );
};
