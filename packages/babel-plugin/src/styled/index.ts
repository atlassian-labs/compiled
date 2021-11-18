import type { NodePath } from '@babel/core';
import * as t from '@babel/types';

import type { Metadata, Tag } from '../types';
import { buildCodeFrameError } from '../utils/ast';
import { buildDisplayName } from '../utils/build-display-name';
import { buildStyledComponent } from '../utils/build-styled-component';
import { buildCss } from '../utils/css-builders';
import type { CSSOutput } from '../utils/types';

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
 * Check whether the node value includes an invalid CSS declaration.
 * This happens when a CSS property is defined with a conditional rule that doesn't specify a default value,
 * resulting in a node that has a CSS value without property ( eg. 'bold').
 *
 * Eg. font-weight: ${(props) => (props.isPrimary && props.isMaybe) && 'bold'}; should be converted
 * into ${(props) => props.isPrimary && props.isMaybe && ({ 'font-weight': 'bold' })};
 *
 * @param node
 */
const hasInValidExpression = (node: t.TaggedTemplateExpression) => {
  const logicalExpressions = node.quasi.expressions.filter((nodeExpression) => {
    return (
      t.isArrowFunctionExpression(nodeExpression) && t.isLogicalExpression(nodeExpression.body)
    );
  });

  if (logicalExpressions.length === 0) {
    return false;
  }

  let invalidExpression = 0;

  node.quasi.quasis.forEach((item) => {
    const value = item.value.raw;
    const declarations = value.split(';');
    const l = declarations.length;

    for (let i = 0; i < l; i++) {
      const d = declarations[i];
      const css = d.substring(d.indexOf(':') + 1);

      // Check if the CSS declaration doesn't contain any value ( eg. '\n font-weight: ')
      if (d.includes(':') && !css.trim().length) {
        invalidExpression++;
        break;
      }
    }
  });

  return invalidExpression > 0;
};

export const transformStyledCallExpression = (
  path: NodePath<t.CallExpression>,
  meta: Metadata
): void => {
  const styledData = extractStyledDataFromObjectLiteral(path.node, meta);
  if (!styledData) {
    // We didn't find a node we're interested in - bail out!
    return;
  }

  const cssOutput: CSSOutput = {
    css: [],
    variables: [],
  };

  // @ts-expect-error
  for (const argument of styledData.cssNode) {
    if (!t.isExpression(argument)) {
      throw buildCodeFrameError(
        `${argument.type} isn't a supported CSS type - try using an object or string`,
        argument,
        path.parentPath
      );
    }

    const result = buildCss(argument, meta);
    cssOutput.css.push(...result.css);
    cssOutput.variables.push(...result.variables);
  }

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

export const transformStyledTaggedTemplateExpression = (
  path: NodePath<t.TaggedTemplateExpression>,
  meta: Metadata
): void => {
  if (hasInValidExpression(path.node)) {
    throw buildCodeFrameError(
      `A logical expression contains an invalid CSS declaration.
      Compiled doesn't support CSS properties that are defined with a conditional rule that doesn't specify a default value.
      Eg. font-weight: \${(props) => (props.isPrimary && props.isMaybe) && 'bold'}; is invalid.
      Use \${(props) => props.isPrimary && props.isMaybe && ({ 'font-weight': 'bold' })}; instead`,
      path.node,
      meta.parentPath
    );
  }

  const styledData = extractStyledDataFromTemplateLiteral(path.node, meta);
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
