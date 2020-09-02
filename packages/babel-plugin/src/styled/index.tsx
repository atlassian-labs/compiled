import * as t from '@babel/types';
import { NodePath } from '@babel/core';
import { buildStyledComponent } from '../utils/ast-builders';
import { buildCss } from '../utils/css-builders';
import { Metadata } from '../types';

/**
 * Interrogates `node` and returns styled data if any were found.
 * @param node
 */
const extractStyledDataFromNode = (
  node: t.TaggedTemplateExpression | t.CallExpression,
  meta: Metadata
): { tagName: string; cssNode: t.Expression } | undefined => {
  if (
    t.isTaggedTemplateExpression(node) &&
    t.isMemberExpression(node.tag) &&
    t.isIdentifier(node.tag.object) &&
    node.tag.object.name === meta.state.compiledImports?.styled &&
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
    node.callee.object.name === meta.state.compiledImports?.styled &&
    t.isExpression(node.arguments[0]) &&
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

/**
 * Takes a styled tagged template or call expression and then transforms it to a compiled component.
 *
 * `styled.div({})`
 *
 * @param path Babel path - expects to be a tagged template or call expression.
 * @param state Babel state - should house options and meta data used during the transformation.
 */
export const visitStyledPath = (
  path: NodePath<t.TaggedTemplateExpression> | NodePath<t.CallExpression>,
  meta: Metadata
) => {
  const styledData = extractStyledDataFromNode(path.node, meta);
  if (!styledData) {
    // We didn't find a node we're interested in - bail out!
    return;
  }

  const cssOutput = buildCss(styledData.cssNode, meta);

  path.replaceWith(
    buildStyledComponent({
      ...meta.state.opts,
      cssOutput,
      tagName: styledData.tagName,
      parentPath: path as NodePath,
      scope: path.scope,
    })
  );
};
