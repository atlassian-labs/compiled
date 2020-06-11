import * as t from '@babel/types';
import { NodePath } from '@babel/core';
import { buildStyledComponent } from '../utils/ast-builders';

export const visitStyledPath = (path: NodePath<t.TaggedTemplateExpression>) => {
  if (
    t.isMemberExpression(path.node.tag) &&
    t.isIdentifier(path.node.tag.object) &&
    path.node.tag.object.name === 'styled'
  ) {
    const tagName = path.node.tag.property.name;
    const css = path.node.quasi.quasis.map((quasi) => quasi.value.cooked).join();

    path.replaceWith(
      buildStyledComponent({
        css,
        tagName,
      })
    );
  }
};
