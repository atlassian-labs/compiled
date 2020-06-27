import * as t from '@babel/types';
import { NodePath } from '@babel/core';
import { buildCompiledComponent } from '../utils/ast-builders';
import { buildCss, CSSOutput } from '../utils/css-builders';
import { State } from '../types';

const extractFromCssProp = (node: t.Expression, state: State): undefined | CSSOutput => {
  if (t.isStringLiteral(node)) {
    return buildCss(node, state);
  }

  if (t.isObjectExpression(node)) {
    return buildCss(node, state);
  }

  if (t.isTemplateLiteral(node)) {
    return buildCss(node, state);
  }

  if (t.isIdentifier(node) && state.declarations) {
    const actualValue = state.declarations[node.name];
    if (actualValue && t.isVariableDeclaration(actualValue) && actualValue.declarations[0].init) {
      return extractFromCssProp(actualValue.declarations[0].init, state);
    }
  }

  return undefined;
};

const getJsxAttributeValue = (node: t.JSXAttribute) => {
  if (t.isStringLiteral(node.value)) {
    return node.value;
  }

  if (t.isJSXExpressionContainer(node.value)) {
    return node.value.expression as t.Expression;
  }

  throw new Error();
};

export const visitCssPropPath = (path: NodePath<t.JSXOpeningElement>, state: State) => {
  let cssPropIndex = -1;
  const cssProp = path.node.attributes.find((attr, index): attr is t.JSXAttribute => {
    if (t.isJSXAttribute(attr) && attr.name.name === 'css') {
      cssPropIndex = index;
      return true;
    }

    return false;
  });

  if (!cssProp || !cssProp.value) {
    return;
  }

  // Remove css prop
  path.node.attributes.splice(cssPropIndex, 1);

  const cssOutput = extractFromCssProp(getJsxAttributeValue(cssProp), state);
  if (cssOutput === undefined) {
    throw path.buildCodeFrameError('Css prop value not allowed.');
  }

  path.parentPath.replaceWith(
    buildCompiledComponent({
      cssOutput,
      node: path.parentPath.node as t.JSXElement,
    })
  );
};
