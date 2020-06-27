import * as t from '@babel/types';
import { NodePath } from '@babel/core';
import { buildCompiledComponent } from '../utils/ast-builders';
import { buildCss, CSSOutput } from '../utils/css-builders';
import { State } from '../types';

const extractCssFromExpression = (node: t.Expression, state: State): CSSOutput => {
  if (t.isIdentifier(node) && state.declarations) {
    const actualValue = state.declarations[node.name];
    if (actualValue && t.isVariableDeclaration(actualValue) && actualValue.declarations[0].init) {
      return buildCss(actualValue.declarations[0].init, state);
    }
  }

  if (t.isArrayExpression(node)) {
    let css = '';
    let variables: CSSOutput['variables'] = [];

    node.elements.forEach((element) => {
      if (!element) {
        return;
      }

      const result = extractCssFromExpression(element as t.Expression, state);
      css += result.css;
      variables = variables.concat(result.variables);
    });

    return { css, variables };
  }

  return buildCss(node, state);
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
  const cssOutput = extractCssFromExpression(getJsxAttributeExpression(cssProp), state);

  path.parentPath.replaceWith(
    buildCompiledComponent({
      ...state.opts,
      cssOutput,
      node: path.parentPath.node as t.JSXElement,
    })
  );
};
