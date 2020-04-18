import * as ts from 'typescript';
import { Declarations } from '../../types';
import * as logger from '../../utils/log';
import { getJsxNodeAttributes, createNodeError } from '../../utils/ast-node';
import { createCompiledComponentFromNode } from '../../utils/create-jsx-element';
import { CSS_PROP_NAME } from '../../constants';
import { buildCss } from '../../utils/css-builder';
import { TransformerOptions } from '../../types';

export const isJsxElementWithCssProp = (
  node: ts.Node
): node is ts.JsxElement | ts.JsxSelfClosingElement => {
  return !!(
    (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) &&
    getJsxNodeAttributes(node).properties.find(
      prop => ts.isJsxAttribute(prop) && prop.name.text === CSS_PROP_NAME
    )
  );
};

const getNodeToExtract = (cssProp: ts.JsxAttribute): ts.Expression => {
  if (!cssProp || !cssProp.initializer) {
    throw createNodeError(
      'Css prop should have been defined. Check a level higher in the code.',
      cssProp
    );
  }

  if (ts.isLiteralExpression(cssProp.initializer)) {
    return cssProp.initializer;
  }

  if (ts.isJsxExpression(cssProp.initializer) && cssProp.initializer.expression) {
    return cssProp.initializer.expression;
  }

  throw createNodeError('Not supported', cssProp);
};

export const visitJsxElementWithCssProp = (
  node: ts.JsxElement | ts.JsxSelfClosingElement,
  variableDeclarations: Declarations,
  context: ts.TransformationContext,
  options: TransformerOptions,
  sourceFile: ts.SourceFile
) => {
  logger.log('visiting a jsx element with a css prop');

  // Grab the css prop node
  const cssProp = getJsxNodeAttributes(node).properties.find(
    prop => ts.isJsxAttribute(prop) && prop.name.escapedText === CSS_PROP_NAME
  ) as ts.JsxAttribute;

  const result = buildCss(getNodeToExtract(cssProp), variableDeclarations, context);

  return createCompiledComponentFromNode(node, {
    sourceFile,
    context,
    propsToRemove: [CSS_PROP_NAME],
    nonce: options.nonce,
    ...result,
  });
};
