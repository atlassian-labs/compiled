import * as ts from 'typescript';
import { getIdentifierText, createNodeError } from '../../utils/ast-node';
import { classNameHash } from '../../utils/hash';
import { createCompiledFragment } from '../../utils/create-jsx-element';
import { CssVariableExpressions, Declarations } from '../../types';
import { STYLE_PROP_NAME } from '../../constants';
import { buildCss } from '../../utils/css-builder';
import { TransformerOptions } from '../../types';

const getCssNode = (node: ts.TaggedTemplateExpression | ts.CallExpression): ts.Expression => {
  if (ts.isCallExpression(node)) {
    return node.arguments[0];
  }

  return node.template;
};

const isCssCallExpression = (node: ts.Node): node is ts.CallExpression => {
  return ts.isCallExpression(node) && getIdentifierText(node.expression) === 'css';
};

const isCssTaggedTemplateExpression = (node: ts.Node): node is ts.TaggedTemplateExpression => {
  return ts.isTaggedTemplateExpression(node) && getIdentifierText(node.tag) === 'css';
};

const isStyleIdentifier = (node: ts.Node): node is ts.Identifier => {
  return (
    ts.isIdentifier(node) && node.escapedText === STYLE_PROP_NAME && !ts.isJsxAttribute(node.parent)
  );
};

export const visitClassNamesJsxElement = (
  classNamesNode: ts.JsxElement,
  context: ts.TransformationContext,
  collectedDeclarations: Declarations,
  options: TransformerOptions,
  sourceFile: ts.SourceFile
): ts.Node => {
  let css = '';
  let cssVariables: CssVariableExpressions[] = [];
  let styleObjectLiteral: ts.ObjectLiteralExpression = ts.createObjectLiteral();

  const visitor = (node: ts.Node): ts.Node => {
    if (isCssCallExpression(node) || isCssTaggedTemplateExpression(node)) {
      const result = buildCss(getCssNode(node), collectedDeclarations, context);
      const className = classNameHash(result.css);

      css += `.${className} { ${result.css} }`;
      cssVariables = cssVariables.concat(result.cssVariables);
      styleObjectLiteral = ts.createObjectLiteral(
        // create new object literal using original object literal properties
        styleObjectLiteral.properties.concat(
          cssVariables.map((cssVar) =>
            ts.createPropertyAssignment(ts.createStringLiteral(cssVar.name), cssVar.expression)
          )
        )
      );

      return ts.createStringLiteral(className);
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

  const returnNode = withStyleParsedNode.children.find((child) => ts.isJsxExpression(child));
  if (
    !returnNode ||
    !ts.isJsxExpression(returnNode) ||
    !returnNode.expression ||
    !ts.isArrowFunction(returnNode.expression)
  ) {
    throw createNodeError(
      'children were invalid should be child as function',
      returnNode || withStyleParsedNode
    );
  }

  const children = ts.isParenthesizedExpression(returnNode.expression.body)
    ? returnNode.expression.body.expression
    : returnNode.expression.body;

  return createCompiledFragment(classNamesNode, {
    ...options,
    css,
    cssVariables,
    children:
      ts.isJsxElement(children) || ts.isJsxSelfClosingElement(children)
        ? children
        : ts.createJsxExpression(undefined, children as any),
    context,
    sourceFile,
  });
};
