import type { NodePath } from '@babel/core';
import * as t from '@babel/types';

import {
  COMPILED_DIRECTIVE_DISABLE_LINE,
  COMPILED_DIRECTIVE_DISABLE_NEXT_LINE,
  COMPILED_DIRECTIVE_TRANSFORM_CSS_PROP,
} from '../constants';
import type { Metadata } from '../types';
import { buildCompiledComponent } from '../utils/build-compiled-component';
import { getNodeComments } from '../utils/comments';
import { buildCss } from '../utils/css-builders';

const getJsxAttributeExpression = (node: t.JSXAttribute) => {
  if (t.isStringLiteral(node.value)) {
    return node.value;
  }

  if (t.isJSXExpressionContainer(node.value)) {
    return node.value.expression as t.Expression;
  }

  throw new Error('Value of JSX attribute was unexpected.');
};

const isCssPropDisabled = (path: NodePath<t.Node>, meta: Metadata): boolean => {
  const { before, current } = getNodeComments(path, meta);

  // Disable the prop if there's a disable next line comment or disable on current line
  return (
    before.some((comment) =>
      comment.value
        .trim()
        .startsWith(
          `${COMPILED_DIRECTIVE_DISABLE_NEXT_LINE} ${COMPILED_DIRECTIVE_TRANSFORM_CSS_PROP}`
        )
    ) ||
    current.some((comment) =>
      comment.value
        .trim()
        .startsWith(`${COMPILED_DIRECTIVE_DISABLE_LINE} ${COMPILED_DIRECTIVE_TRANSFORM_CSS_PROP}`)
    )
  );
};

/**
 * Takes a JSX opening element and then transforms any usage of `css` prop to a compiled component.
 *
 * `<div css={{}}>`
 *
 * @param path {NodePath} The opening JSX element
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 */
export const visitCssPropPath = (path: NodePath<t.JSXOpeningElement>, meta: Metadata): void => {
  let cssPropIndex = -1;
  const cssProp = path.get('attributes').find((attr, index): attr is NodePath<t.JSXAttribute> => {
    if (t.isJSXAttribute(attr.node) && attr.node.name.name === 'css') {
      cssPropIndex = index;
      return true;
    }

    return false;
  });

  if (!cssProp || !cssProp.node.value) {
    return;
  }

  // CSS prop disabled with comment directive (check both the JSX element and the css prop)
  if (isCssPropDisabled(path, meta) || isCssPropDisabled(cssProp, meta)) {
    return;
  }

  const cssOutput = buildCss(getJsxAttributeExpression(cssProp.node), meta);

  // Remove css prop
  path.node.attributes.splice(cssPropIndex, 1);

  if (!cssOutput.css.length) {
    // No css was generated - return early!
    return;
  }

  path.parentPath.replaceWith(
    buildCompiledComponent(path.parentPath.node as t.JSXElement, cssOutput, meta)
  );
};
