import type { NodePath } from '@babel/core';
import * as t from '@babel/types';

import type { Metadata } from '../types';
import { buildCodeFrameError } from '../utils/ast';

import { getKeyframes } from './utils';

export const transformKeyframesCallExpression = (
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

  const { css, name } = getKeyframes(argument, meta);

  path.replaceWith(
    t.objectExpression([
      t.objectProperty(t.identifier('css'), t.arrayExpression(css.map((x) => t.stringLiteral(x)))),
      t.objectProperty(t.identifier('name'), t.stringLiteral(name)),
    ])
  );
};
