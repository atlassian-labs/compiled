import traverse from '@babel/traverse';
import * as t from '@babel/types';

import type { Result } from './types';

/**
 * Find the default export of a file and return the export's node and path.
 *
 * E.g: `export default 'blue';`
 * Will return the string literal node for 'blue'.
 *
 * E.g: `export default color;`
 * Will return the identifier node for `color`.
 *
 * @param ast File we want to traverse.
 */
export const getDefaultExport = (ast: t.File): Result<t.ExportDefaultDeclaration> | undefined => {
  let result;

  traverse(ast, {
    ExportDefaultDeclaration(path) {
      result = { path, node: path.node.declaration };
      path.stop();
    },
    // Handle `export {alias as default}`
    ExportNamedDeclaration(path) {
      path.get('specifiers')?.forEach(({ node }) => {
        if (t.isExportSpecifier(node) && t.isIdentifier(node.exported, { name: 'default' })) {
          result = { path, node: node.local };
          path.stop();
        }
      });
    },
  });

  return result;
};

/**
 * Find a named export in a file and return the export's node and path.
 *
 * Handles the two types of named exports:
 *
 * Variable declaration:
 * `export const blue = 'blue';`
 * Will return the identifier node for `blue`.
 *
 * Export specifier:
 * ```
 * const color = 'blue';
 * export { color };
 * ```
 * Will return the identifier node for `color`.
 *
 * @param ast File we want to traverse.
 * @param exportName Name of the export we're looking for.
 */
export const getNamedExport = (
  ast: t.File,
  exportName: string
): Result<t.ExportNamedDeclaration> | undefined => {
  let result;

  traverse(ast, {
    ExportNamedDeclaration(path) {
      const { node } = path;
      const declarations = t.isVariableDeclaration(node.declaration)
        ? node.declaration.declarations
        : node.specifiers;

      (declarations as (t.VariableDeclarator | t.ExportSpecifier)[]).find((declaration) => {
        const identifier = t.isVariableDeclarator(declaration)
          ? declaration.id
          : declaration.exported;

        if (t.isIdentifier(identifier, { name: exportName })) {
          result = {
            path,
            node: t.isVariableDeclarator(declaration) ? declaration.init : identifier,
          };

          path.stop();
          return true;
        }

        return false;
      });
    },
  });

  return result;
};
