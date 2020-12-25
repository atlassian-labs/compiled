import * as t from '@babel/types';
import { NodePath } from '@babel/core';
import { buildCompiledComponent } from '../utils/ast-builders';
import { buildCss } from '../utils/css-builders';
import { Metadata } from '../types';
import { getJsxAttributeExpression } from '../utils/ast';

/**
 * Takes a JSX opening element and then transforms any usage of `css` prop to a compiled component.
 *
 * `<div css={{}}>`
 *
 * @param path Babel path - expects to be a JSX opening element.
 * @param state Babel state - should house options and meta data used during the transformation.
 */
export const visitCssPropPath = (path: NodePath<t.JSXOpeningElement>, meta: Metadata) => {
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

  const cssOutput = buildCss(getJsxAttributeExpression(cssProp), meta);

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
