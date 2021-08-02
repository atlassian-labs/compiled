import * as t from '@babel/types';
import { NodePath } from '@babel/core';
import { buildStyledComponent, buildDisplayName } from '../utils/ast-builders';
import { buildCss } from '../utils/css-builders';
import { Metadata, Tag } from '../types';

interface StyledData {
  tag: Tag;
  cssNode: t.Expression | t.Expression[];
}

const createStyledDataPair = ({
  tagName,
  tagType,
  cssNode,
}: {
  tagName: string;
  tagType: Tag['type'];
  cssNode: t.Expression | t.Expression[];
}) => ({
  tag: {
    name: tagName,
    type: tagType,
  },
  cssNode,
});

const extractStyledDataFromTemplateLiteral = (
  node: t.TaggedTemplateExpression,
  meta: Metadata
): StyledData | undefined => {
  if (
    t.isMemberExpression(node.tag) &&
    t.isIdentifier(node.tag.object) &&
    node.tag.object.name === meta.state.compiledImports?.styled &&
    t.isIdentifier(node.tag.property)
  ) {
    const tagName = node.tag.property.name;
    const cssNode = node.quasi;

    return createStyledDataPair({ tagName, tagType: 'InBuiltComponent', cssNode });
  }

  if (
    t.isCallExpression(node.tag) &&
    t.isIdentifier(node.tag.callee) &&
    node.tag.callee.name === meta.state.compiledImports?.styled &&
    t.isIdentifier(node.tag.arguments[0])
  ) {
    const tagName = node.tag.arguments[0].name;
    const cssNode = node.quasi;

    return createStyledDataPair({ tagName, tagType: 'UserDefinedComponent', cssNode });
  }

  return undefined;
};

const extractStyledDataFromObjectLiteral = (
  node: t.CallExpression,
  meta: Metadata
): StyledData | undefined => {
  if (
    t.isMemberExpression(node.callee) &&
    t.isIdentifier(node.callee.object) &&
    node.callee.object.name === meta.state.compiledImports?.styled &&
    t.isExpression(node.arguments[0]) &&
    t.isIdentifier(node.callee.property)
  ) {
    const tagName = node.callee.property.name;
    const cssNode = node.arguments as t.Expression[];

    return createStyledDataPair({ tagName, tagType: 'InBuiltComponent', cssNode });
  }

  if (
    t.isCallExpression(node.callee) &&
    t.isIdentifier(node.callee.callee) &&
    node.callee.callee.name === meta.state.compiledImports?.styled &&
    t.isExpression(node.arguments[0]) &&
    t.isIdentifier(node.callee.arguments[0])
  ) {
    const tagName = node.callee.arguments[0].name;
    const cssNode = node.arguments as t.Expression[];

    return createStyledDataPair({ tagName, tagType: 'UserDefinedComponent', cssNode });
  }

  return undefined;
};

/**
 * Interrogates `node` and returns styled data if any were found.
 * @param node
 */
const extractStyledDataFromNode = (
  node: t.TaggedTemplateExpression | t.CallExpression,
  meta: Metadata
) => {
  if (t.isTaggedTemplateExpression(node)) {
    return extractStyledDataFromTemplateLiteral(node, meta);
  }

  if (t.isCallExpression(node)) {
    return extractStyledDataFromObjectLiteral(node, meta);
  }

  return undefined;
};

/**
 * Transform a node before the style is extracted, if the node value doesn't include a valid CSS declaration.
 * This happens when a CSS property is defined with a conditional rule that doesn't specify a default value,
 * resulting in a node that has a CSS value without property ( eg. 'bold').
 *
 * Eg. Transform font-weight: ${(props) => (props.isPrimary && props.isMaybe) && 'bold'};
 * into ${(props) => props.isPrimary && props.isMaybe && ({ 'font-weight': 'bold' })};
 *
 * @param node
 */
const transformNodeWithoutDefaultCssValue = (node: t.TaggedTemplateExpression) => {
  const logicalExpressions = node.quasi.expressions.filter((nodeExpression) => {
    return (
      t.isArrowFunctionExpression(nodeExpression) && t.isLogicalExpression(nodeExpression.body)
    );
  });

  if (logicalExpressions.length === 0) {
    return;
  }

  node.quasi.quasis.forEach((item, index) => {
    const value = item.value.raw;
    const declarations = value.split(';');

    declarations.forEach((d) => {
      const css = d.substring(d.indexOf(':') + 1);

      // Check if the CSS declaration doesn't contain any value ( eg. '\n font-weight: ')
      if (d.includes(':') && !css.trim().length) {
        const nodeExpression = node.quasi.expressions[index];

        if (
          nodeExpression &&
          t.isArrowFunctionExpression(nodeExpression) &&
          t.isLogicalExpression(nodeExpression.body) &&
          t.isStringLiteral(nodeExpression.body.right)
        ) {
          const cssValue = nodeExpression.body.right.value;
          const cssProps = d.substr(0, d.indexOf(':'));

          nodeExpression.body.right.value = `${cssProps}: ${cssValue}`;
          item.value.raw = item.value.raw.replace(d, '');
          item.value.cooked = item.value.raw.replace(d, '');
        }
      }
    });
  });
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
): void => {
  if (t.isTaggedTemplateExpression(path.node)) {
    transformNodeWithoutDefaultCssValue(path.node);
  }

  const styledData = extractStyledDataFromNode(path.node, meta);
  if (!styledData) {
    // We didn't find a node we're interested in - bail out!
    return;
  }

  const cssOutput = buildCss(styledData.cssNode, meta);

  path.replaceWith(buildStyledComponent(styledData.tag, cssOutput, meta));

  const parentVariableDeclaration = path.findParent((x) => x.isVariableDeclaration());
  if (parentVariableDeclaration && t.isVariableDeclaration(parentVariableDeclaration.node)) {
    const variableDeclarator = parentVariableDeclaration.node.declarations[0];
    if (t.isIdentifier(variableDeclarator.id)) {
      const variableName = variableDeclarator.id.name;
      parentVariableDeclaration.insertAfter(buildDisplayName(variableName));
    }
  }
};
