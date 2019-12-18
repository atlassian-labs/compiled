import * as ts from 'typescript';
import { getIdentifierText } from '../../utils/ast-node';
import { objectLiteralToCssString } from '../../utils/object-literal-to-css';
import { nextClassName } from '../../utils/identifiers';
import { createStyleFragment } from '../../utils/create-jsx-element';
import { CssVariableExpressions } from '../../types';

const visitCssCallExpression = (node: ts.CallExpression) => {
  if (!ts.isObjectLiteralExpression(node.arguments[0])) {
    throw new Error('only support object literal atm');
  }

  const cssArgument: ts.ObjectLiteralExpression = node.arguments[0] as ts.ObjectLiteralExpression;
  const extracted = objectLiteralToCssString(cssArgument, {});
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

export const visitClassNamesJsxElement = (
  classNamesNode: ts.JsxElement,
  context: ts.TransformationContext
): ts.Node => {
  let css = '';
  let cssVariables: CssVariableExpressions[] = [];

  const visitor = (node: ts.Node): ts.Node => {
    if (isCssCallExpression(node)) {
      const result = visitCssCallExpression(node);
      css += result.extracted.css;
      cssVariables = cssVariables.concat(result.extracted.cssVariables);
      return result.node;
    }

    return ts.visitEachChild(node, visitor, context);
  };

  const newClassNamesNode = ts.visitEachChild(classNamesNode, visitor, context);

  const returnNode = newClassNamesNode.children.find(child => ts.isJsxExpression(child));
  if (
    !returnNode ||
    !ts.isJsxExpression(returnNode) ||
    !returnNode.expression ||
    !ts.isArrowFunction(returnNode.expression)
  ) {
    throw new Error('children were invalid should be child as function');
  }

  return createStyleFragment({
    selector: '',
    css,
    cssVariables,
    children: returnNode.expression.body as any,
  });
};
