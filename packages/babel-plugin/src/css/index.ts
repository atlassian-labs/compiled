import type { NodePath } from '@babel/core';
import * as t from '@babel/types';

import type { Metadata } from '../types';
import { buildCodeFrameError } from '../utils/ast';
import { buildCssVariables } from '../utils/build-css-variables';
import { buildCss } from '../utils/css-builders';
import { transformCssItems } from '../utils/transform-css-items';

const buildCssNode = (expression: t.Expression, meta: Metadata) => {
  const { css, variables } = buildCss(expression, meta);
  const { classNames, sheets } = transformCssItems(css);
  return t.objectExpression([
    t.objectProperty(t.identifier('classNames'), t.arrayExpression(classNames)),
    t.objectProperty(
      t.identifier('css'),
      // TODO shouldn't have reference type here...
      t.stringLiteral(
        sheets.map((sheet) => (sheet.type === 'reference' ? sheet.reference : sheet.css)).join('')
      )
    ),
    t.objectProperty(t.identifier('style'), t.objectExpression(buildCssVariables(variables))),
  ]);
};

export const transformCssCallExpression = (
  path: NodePath<t.CallExpression>,
  meta: Metadata
): void => {
  const { node } = path;
  if (node.arguments.length !== 1) {
    throw buildCodeFrameError(
      `Expected 1 argument, but got ${node.arguments}`,
      node,
      meta.parentPath
    );
  }

  const [argument] = node.arguments;
  if (
    argument.type !== 'ObjectExpression' &&
    argument.type !== 'StringLiteral' &&
    argument.type !== 'TemplateLiteral'
  ) {
    throw buildCodeFrameError(
      `Expected argument to be of type {ObjectExpression, StringLiteral, TemplateLiteral}, but got ${argument.type}`,
      node,
      meta.parentPath
    );
  }

  path.replaceWith(buildCssNode(argument, meta));
};

export const transformCssTaggedTemplateExpression = (
  path: NodePath<t.TaggedTemplateExpression>,
  meta: Metadata
): void => {
  const { node } = path;

  path.replaceWith(buildCssNode(node.quasi, meta));
};
