import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

import type { Metadata } from '../types';

/*
 * Hoists a sheet to the top of the module if its not already there.
 * Returns the referencing identifier.
 *
 * @param sheet {string} Stylesheet
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 */
export const hoistSheet = (sheet: string, meta: Metadata): t.Identifier => {
  if (meta.state.sheets[sheet]) {
    return meta.state.sheets[sheet];
  }

  const sheetIdentifier = meta.parentPath.scope.generateUidIdentifier('');
  const parent = meta.parentPath.findParent((path) => path.isProgram());
  const parentBody = parent && (parent.get('body') as NodePath[]);
  const path = parentBody && parentBody.filter((path) => !path.isImportDeclaration())[0];

  if (path) {
    const kind = 'const';
    const newVariable = t.variableDeclarator(sheetIdentifier, t.stringLiteral(sheet));
    path.insertBefore(t.variableDeclaration(kind, [newVariable])).forEach((newVariable) => {
      // Register the binding so it's now available in scope.
      meta.parentPath.scope.registerBinding(kind, newVariable as NodePath<t.Node>);
    });
  }

  meta.state.sheets[sheet] = sheetIdentifier;

  return sheetIdentifier;
};
