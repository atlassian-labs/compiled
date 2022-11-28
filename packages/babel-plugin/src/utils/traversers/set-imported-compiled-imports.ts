import traverse from '@babel/traverse';
import * as t from '@babel/types';

import type { State } from '../../types';

/**
 * CompiledImports are checked in the entry file, but not when resolving bindings.
 * Update state if imported file uses a Compiled API.
 *
 * @param ast File we want to traverse.
 * @param state State of the current plugin run
 */
export const setImportedCompiledImports = (ast: t.File, state: State): void => {
  const apiName = 'css';

  traverse(ast, {
    ImportDeclaration(path) {
      path.get('specifiers')?.forEach(({ node }) => {
        if (!t.isImportSpecifier(node)) {
          return;
        }

        state.importedCompiledImports = state.importedCompiledImports || {};

        if (t.isIdentifier(node?.imported) && node?.imported.name === apiName) {
          state.importedCompiledImports[apiName] = node.local.name;
          path.stop();
        }
      });
    },
  });
};
