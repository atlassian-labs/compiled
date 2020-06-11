import * as t from '@babel/types';
import { NodePath } from '@babel/core';
import { buildCompiledComponent } from '../utils/ast-builders';

const extractFromCssProp = (
  cssProp: t.StringLiteral | t.JSXElement | t.JSXFragment | t.JSXExpressionContainer
) => {
  if (t.isStringLiteral(cssProp)) {
    return cssProp.value;
  }

  return undefined;
};

export const visitCssPropPath = (path: NodePath<t.JSXOpeningElement>) => {
  const cssProp = path.node.attributes.find((attr): attr is t.JSXAttribute => {
    return t.isJSXAttribute(attr) && attr.name.name === 'css';
  });

  if (!cssProp || !cssProp.value) {
    return;
  }

  const extractedCss = extractFromCssProp(cssProp.value);
  if (!extractedCss) {
    throw path.buildCodeFrameError('Css prop value not allowed.');
  }

  path.parentPath.replaceWith(
    buildCompiledComponent({
      css: extractedCss,
    })
  );
};
