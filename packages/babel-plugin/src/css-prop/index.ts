import type { NodePath } from '@babel/core';
import * as t from '@babel/types';

import type { Metadata } from '../types';
import { buildCodeFrameError } from '../utils/ast';
import { buildCompiledComponent } from '../utils/build-compiled-component';

import { getCss } from './utils';

// const getJsxAttributeExpression = (node: t.JSXAttribute) => {
//   if (t.isStringLiteral(node.value)) {
//     return node.value;
//   }
//
//   if (t.isJSXExpressionContainer(node.value)) {
//     return node.value.expression as t.Expression;
//   }
//
//   throw new Error(
//     `Expected type StringLiteral or JSXExpressionContainer, but got ${node.value?.type}`
//   );
// };

/**
 * Takes a JSX opening element and then transforms any usage of `css` prop to a compiled component.
 *
 * `<div css={{}}>`
 *
 * @param path {NodePath} The opening JSX element
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 */
export const transformCssProp = (path: NodePath<t.JSXOpeningElement>, meta: Metadata): void => {
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

  // TODO add css if not a variable? or just enforce them to be
  // TODO or just make it not possible to not use without css
  /* TODO
    css={{
      ...largeText,
      ...pinkText,
    }}>
   */

  // const cssOutput = buildCss(getJsxAttributeExpression(cssProp), meta);
  const { value } = cssProp;
  if (!t.isJSXExpressionContainer(value)) {
    throw buildCodeFrameError(
      `Expected type JSXExpressionContainer, but got ${value.type}`,
      path.node,
      path.parentPath
    );
  }

  const { expression } = value;
  let css;

  try {
    css = getCss(expression, meta);
  } catch (err) {
    throw buildCodeFrameError(err.message, err.node, path.parentPath);
  }

  path.parentPath.replaceWith(
    buildCompiledComponent(path.parentPath.node as t.JSXElement, css, meta)
  );

  // Remove css prop
  path.node.attributes.splice(cssPropIndex, 1);
};
