import * as t from '@babel/types';
import { NodePath } from '@babel/core';
import { buildStyledComponent } from '../utils/ast-builders';
import { buildCss } from '../utils/css-builders';
import { State } from '../types';

const extractStyledDataFromNode = (
  node: t.TaggedTemplateExpression | t.CallExpression
): { tagName: string; cssNode: t.Expression } | undefined => {
  if (
    t.isTaggedTemplateExpression(node) &&
    t.isMemberExpression(node.tag) &&
    t.isIdentifier(node.tag.object) &&
    node.tag.object.name === 'styled' &&
    t.isIdentifier(node.tag.property)
  ) {
    const tagName = node.tag.property.name;
    const cssNode = node.quasi;

    return {
      tagName,
      cssNode,
    };
  }

  if (
    t.isCallExpression(node) &&
    t.isMemberExpression(node.callee) &&
    t.isIdentifier(node.callee.object) &&
    node.callee.object.name === 'styled' &&
    t.isObjectExpression(node.arguments[0]) &&
    t.isIdentifier(node.callee.property)
  ) {
    const tagName = node.callee.property.name;
    const cssNode = node.arguments[0];

    return {
      tagName,
      cssNode,
    };
  }

  return undefined;
};

export const visitStyledPath = (
  path: NodePath<t.TaggedTemplateExpression> | NodePath<t.CallExpression>,
  state: State
) => {
  const styledData = extractStyledDataFromNode(path.node);
  if (!styledData) {
    return;
  }

  const cssOutput = buildCss(styledData.cssNode, state);

  path.replaceWith(
    buildStyledComponent({
      cssOutput,
      tagName: styledData.tagName,
      parentPath: path as NodePath,
      scope: path.scope,
    })
  );
};
