import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

/**
 * Wrapper to make defining import specifiers easier.
 * If `localName` is defined it will rename the import to it,
 * e.g: `name as localName`.
 *
 * @param name import name
 * @param localName local name
 */
const importSpecifier = (name: string, localName?: string): t.ImportSpecifier => {
  return t.importSpecifier(t.identifier(name), t.identifier(localName || name));
};

/**
 * Appends runtime import to code. If it is already present, it will append import specifiers
 * to already imported declaration path else it will create fresh import declaration path
 * with runtime import specifiers.
 *
 * @param path ImportDeclaration node path
 */
export const appendRuntimeImports = (path: NodePath<t.Program>): void => {
  const runtimeImportNames = ['ax', 'ix', 'CC', 'CS'];
  const runtimeImportModuleName = '@compiled/react/runtime';

  // Check if we have any sibling runtime import
  const runtimeImportFound = path
    .getAllPrevSiblings()
    .concat(path.getAllNextSiblings())
    .find(
      (path) =>
        t.isImportDeclaration(path.node) && path.node.source.value === runtimeImportModuleName
    ) as NodePath<t.ImportDeclaration> | undefined;

  if (runtimeImportFound) {
    /**
     * Get local import name instead of imported name to handle scenario when
     * import specifier is imported as named and normal both.
     *
     * eg. import { CC as CompiledRoot, ax, CC, CS } from '@compiled/react/runtime';
     * In above example `CC` is used both as `CompiledRoot` and `CC`.
     */
    const localImportNames = runtimeImportFound
      .get('specifiers')
      .map((specifier) => specifier.node.local.name);

    runtimeImportNames.forEach((runtimeImportName) => {
      // Avoids duplicate imports from being appended if already present
      if (!localImportNames.includes(runtimeImportName)) {
        runtimeImportFound.pushContainer('specifiers', importSpecifier(runtimeImportName));
      }
    });
  } else {
    // Add the runtime entrypoint module
    path.insertBefore(
      t.importDeclaration(
        runtimeImportNames.map((runtimeImportName) => importSpecifier(runtimeImportName)),
        t.stringLiteral(runtimeImportModuleName)
      )
    );
  }
};
