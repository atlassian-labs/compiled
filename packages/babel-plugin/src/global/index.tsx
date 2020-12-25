import * as t from '@babel/types';
import { NodePath } from '@babel/core';
import { buildCompiledComponent } from '../utils/ast-builders';
import { buildCss } from '../utils/css-builders';
import { getJsxAttributeExpression } from '../utils/ast';
import { Metadata } from '../types';

const getStylesProp = (path: NodePath<t.JSXOpeningElement>) => {
  const stylesProp = path.node.attributes.find((attr, index): attr is t.JSXAttribute => {
    if (t.isJSXAttribute(attr) && attr.name.name === 'styles') {
      return true;
    }

    return false;
  });

  return stylesProp;
};

export function visitGlobalPath(path: NodePath<t.JSXOpeningElement>, meta: Metadata): void {
  const stylesProp = getStylesProp(path);
  if (!stylesProp) {
    path.parentPath.replaceWith(t.nullLiteral());
    return;
  }

  const styles = getJsxAttributeExpression(stylesProp);
  const css = buildCss(styles, meta);
  if (css.css.length === 0) {
    path.parentPath.replaceWith(t.nullLiteral());
    return;
  }
}
