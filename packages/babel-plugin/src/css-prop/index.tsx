import * as t from '@babel/types';
import { NodePath } from '@babel/core';
import { buildCompiledComponent } from '../utils/ast-builders';
import { buildCss, CSSOutput } from '../utils/css-builders';
import { Metadata } from '../types';

const extractCssFromExpression = (node: t.Expression, meta: Metadata): CSSOutput => {
  if (t.isIdentifier(node)) {
    const binding = meta.parentPath.scope.getBinding(node.name);

    if (
      binding &&
      t.isVariableDeclarator(binding.path.node) &&
      t.isExpression(binding.path.node.init)
    ) {
      return buildCss(binding.path.node.init, meta);
    }
  }

  if (t.isArrayExpression(node)) {
    let css = '';
    let variables: CSSOutput['variables'] = [];

    node.elements.forEach((element) => {
      if (!element) {
        return;
      }

      const result = extractCssFromExpression(element as t.Expression, meta);
      css += result.css;
      variables = variables.concat(result.variables);
    });

    return { css, variables };
  }

  return buildCss(node, meta);
};

const getJsxAttributeExpression = (node: t.JSXAttribute) => {
  if (t.isStringLiteral(node.value)) {
    return node.value;
  }

  if (t.isJSXExpressionContainer(node.value)) {
    return node.value.expression as t.Expression;
  }

  throw new Error();
};

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

  // Remove css prop
  path.node.attributes.splice(cssPropIndex, 1);
  const cssOutput = extractCssFromExpression(getJsxAttributeExpression(cssProp), meta);

  path.parentPath.replaceWith(
    buildCompiledComponent({
      ...meta.state.opts,
      cssOutput,
      node: path.parentPath.node as t.JSXElement,
    })
  );
};
