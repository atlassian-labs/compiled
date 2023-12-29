import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

import type { State } from '../types';

export const isTransformedJsxFunction = (
  path: NodePath<t.TaggedTemplateExpression> | NodePath<t.CallExpression>,
  state: State
): boolean => {
  return !!(
    state.compiledImports &&
    t.isCallExpression(path.node) &&
    t.isIdentifier(path.node.callee) &&
    // path.node.callee.name === state.pragma.classicJsxPragmaLocalName
    // is what checks for usages of the `jsx` function for Compiled
    //
    // path.node.callee.name === 'jsx'
    // is really only to check for other CSS-in-JS library usages
    // (e.g. Emotion) in files that import Compiled
    (path.node.callee.name === 'jsx' ||
      path.node.callee.name === state.pragma.classicJsxPragmaLocalName)
  );
};
