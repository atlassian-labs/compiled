import * as t from '@babel/types';
import { NodePath } from '@babel/core';
import { buildCompiledComponent } from '../utils/ast-builders';
import { buildCss } from '../utils/css-builders';
import { State } from '../types';

const extractFromCssProp = (
  node: t.StringLiteral | t.JSXElement | t.JSXFragment | t.JSXExpressionContainer,
  state: State
) => {
  if (t.isStringLiteral(node)) {
    return buildCss(node, state);
  }

  if (t.isJSXExpressionContainer(node) && t.isObjectExpression(node.expression)) {
    return buildCss(node.expression, state);
  }

  return undefined;
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

  const cssOutput = extractFromCssProp(cssProp.value, state);
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
