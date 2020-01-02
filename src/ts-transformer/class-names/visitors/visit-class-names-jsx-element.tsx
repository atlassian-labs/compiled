import * as ts from 'typescript';
import { getIdentifierText } from '../../utils/ast-node';
import { objectLiteralToCssString } from '../../utils/object-literal-to-css';
import { nextClassName } from '../../utils/identifiers';
import { createStyleFragment } from '../../utils/create-jsx-element';
import { CssVariableExpressions, VariableDeclarations } from '../../types';

const STYLE_IDENTIFIER = 'style';

const visitCssCallExpression = (
  node: ts.CallExpression,
  context: ts.TransformationContext,
  collectedDeclarations: VariableDeclarations
) => {
  if (!ts.isObjectLiteralExpression(node.arguments[0])) {
    throw new Error('only support object literal atm');
  }

  const cssArgument: ts.ObjectLiteralExpression = node.arguments[0] as ts.ObjectLiteralExpression;
  const extracted = objectLiteralToCssString(cssArgument, collectedDeclarations, context);
  const className = nextClassName();

  return {
    extracted: {
      css: `.${className} { ${extracted.css} }`,
      cssVariables: extracted.cssVariables,
    },
    node: ts.createStringLiteral(className),
  };
};

const isCssCallExpression = (node: ts.Node): node is ts.CallExpression => {
  return ts.isCallExpression(node) && getIdentifierText(node.expression) === 'css';
};

const isStyleIdentifier = (node: ts.Node): node is ts.Identifier => {
  return (
    ts.isIdentifier(node) &&
    node.escapedText === STYLE_IDENTIFIER &&
    !ts.isJsxAttribute(node.parent)
  );
};

export const visitClassNamesJsxElement = (
  classNamesNode: ts.JsxElement,
  context: ts.TransformationContext,
  collectedDeclarations: VariableDeclarations
): ts.Node => {
  let css = '';
  let cssVariables: CssVariableExpressions[] = [];
  let styleObjectLiteral: ts.ObjectLiteralExpression = ts.createObjectLiteral();

  const visitor = (node: ts.Node): ts.Node => {
    if (isCssCallExpression(node)) {
      const result = visitCssCallExpression(node, context, collectedDeclarations);
      css += result.extracted.css;

      cssVariables = cssVariables.concat(result.extracted.cssVariables);

      styleObjectLiteral = ts.createObjectLiteral(
        // create new object literal using original object literal properties
        styleObjectLiteral.properties.concat(
          cssVariables.map(cssVar =>
            ts.createPropertyAssignment(ts.createStringLiteral(cssVar.name), cssVar.identifier)
          )
        )
      );

      return result.node;
    }

    return ts.visitEachChild(node, visitor, context);
  };

  const styleVisitor = (node: ts.Node): ts.Node => {
    if (isStyleIdentifier(node)) {
      return styleObjectLiteral;
    }

    return ts.visitEachChild(node, styleVisitor, context);
  };

  // Do one pass to build the css and css variables
  const newClassNamesNode = ts.visitEachChild(classNamesNode, visitor, context);

  // Do another pass that will replace style identifier with the style object literal
  const withStyleParsedNode = ts.visitEachChild(newClassNamesNode, styleVisitor, context);

  const returnNode = withStyleParsedNode.children.find(child => ts.isJsxExpression(child));
  if (
    !returnNode ||
    !ts.isJsxExpression(returnNode) ||
    !returnNode.expression ||
    !ts.isArrowFunction(returnNode.expression)
  ) {
    throw new Error('children were invalid should be child as function');
  }

  const children = ts.isParenthesizedExpression(returnNode.expression.body)
    ? returnNode.expression.body.expression
    : returnNode.expression.body;

  return createStyleFragment({
    selector: '',
    css,
    cssVariables,
    originalNode: classNamesNode,
    children: children as any,
  });
};
