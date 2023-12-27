import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

import type { State } from '../types';

export const isJsx = (
  path: NodePath<t.TaggedTemplateExpression> | NodePath<t.CallExpression>,
  state: State
): boolean => {
  return !!(
    state.compiledImports &&
    t.isCallExpression(path.node) &&
    t.isIdentifier(path.node.callee) &&
    (path.node.callee.name === 'jsx' ||
      path.node.callee.name === state.pragma.classicJsxPragmaLocalName)
  );
};
