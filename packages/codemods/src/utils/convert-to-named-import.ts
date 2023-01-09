import type {
  Collection,
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportSpecifier,
  JSCodeshift,
} from 'jscodeshift';

import { COMPILED_IMPORT_PATH } from '../constants';
import type { CodemodPluginInstance } from '../plugins/types';

import { getImportDeclarationCollection } from './import-declarations';

const applyBuildImport = ({
  plugins,
  originalNode,
  specifiers,
}: {
  plugins: CodemodPluginInstance[];
  originalNode: ImportDeclaration | null;
  specifiers: ImportSpecifier[];
}) =>
  plugins.reduce((currentNode, plugin) => {
    const buildImportImpl = plugin.transform?.buildImport;
    if (!buildImportImpl) {
      return currentNode;
    }

    return buildImportImpl({
      originalNode,
      currentNode,
      specifiers,
      compiledImportPath: COMPILED_IMPORT_PATH,
    });
  }, originalNode);

const getImportDefaultSpecifierName = (
  importDefaultSpecifierCollection: Collection<ImportDefaultSpecifier>
): string => {
  const name = importDefaultSpecifierCollection.nodes()[0]!.local!.name;
  if (!name) {
    throw new Error('Name should exist');
  }

  return name;
};

export const convertDefaultImportToNamedImport = ({
  j,
  plugins,
  collection,
  importPath,
  namedImport,
}: {
  j: JSCodeshift;
  plugins: CodemodPluginInstance[];
  collection: Collection<any>;
  importPath: string;
  namedImport: string;
}): void => {
  const importDeclarationCollection: Collection<ImportDeclaration> = getImportDeclarationCollection(
    {
      j,
      collection,
      importPath,
    }
  );

  importDeclarationCollection.forEach((importDeclarationPath) => {
    const importDefaultSpecifierCollection = j(importDeclarationPath).find(
      j.ImportDefaultSpecifier
    );

    if (importDefaultSpecifierCollection.length > 0) {
      const newImport = applyBuildImport({
        plugins,
        originalNode: importDeclarationPath.node,
        specifiers: [
          j.importSpecifier(
            j.identifier(namedImport),
            j.identifier(getImportDefaultSpecifierName(importDefaultSpecifierCollection))
          ),
        ],
      });

      j(importDeclarationPath).replaceWith(newImport);
    }
  });
};

export const convertMixedImportToNamedImport = ({
  j,
  plugins,
  collection,
  importPath,
  defaultSourceSpecifierName,
  allowedImportSpecifierNames,
}: {
  j: JSCodeshift;
  plugins: CodemodPluginInstance[];
  collection: Collection<any>;
  importPath: string;
  defaultSourceSpecifierName: string;
  allowedImportSpecifierNames: string[];
}): void => {
  const importDeclarationCollection: Collection<ImportDeclaration> = getImportDeclarationCollection(
    {
      j,
      collection,
      importPath,
    }
  );

  importDeclarationCollection.forEach((importDeclarationPath) => {
    const newSpecifiers = (importDeclarationPath.node.specifiers || [])
      .map((specifier) => {
        if (
          !(specifier.type === 'ImportDefaultSpecifier') &&
          !(specifier.type === 'ImportSpecifier')
        )
          return undefined;

        const newSpecifier =
          specifier.type === 'ImportDefaultSpecifier'
            ? j.importSpecifier(
                j.identifier(defaultSourceSpecifierName),
                j.identifier(specifier.local?.name || '')
              )
            : j.importSpecifier(
                j.identifier(specifier.imported.name),
                j.identifier(specifier.local?.name || '')
              );

        // Since we already have the previous and new specifier here, we copy over inline comments.
        // Due to open recast Issue #191, for inline comment lines, trailing comments are being turned into leading comments.
        // To avoid this and to preserve location information, we copy over all inline comments as block comments.
        // Link: https://github.com/benjamn/recast/issues/191
        newSpecifier.comments =
          specifier.comments?.map((comment) =>
            j.commentBlock(comment.value, comment.leading, comment.trailing)
          ) || [];

        return newSpecifier;
      })
      .filter((specifier): specifier is ImportSpecifier =>
        Boolean(
          specifier &&
            [defaultSourceSpecifierName, ...allowedImportSpecifierNames].includes(
              specifier?.imported.name
            )
        )
      );

    newSpecifiers.sort(({ imported: { name: nameA } }, { imported: { name: nameB } }) =>
      nameA.localeCompare(nameB)
    );

    const originalNode = importDeclarationPath.node;
    const unresolvedSpecifiers = originalNode.specifiers?.filter(
      (specifier) =>
        specifier.type !== 'ImportDefaultSpecifier' &&
        !(
          specifier.type === 'ImportSpecifier' &&
          allowedImportSpecifierNames.includes(specifier?.imported?.name)
        )
    );
    if (unresolvedSpecifiers?.length && unresolvedSpecifiers.length > 0) {
      // Create a new declaration with the unresolved imports
      j(importDeclarationPath).insertAfter(
        j.importDeclaration(unresolvedSpecifiers, originalNode.source)
      );
    }

    const newImport = applyBuildImport({
      plugins,
      originalNode: originalNode,
      specifiers: newSpecifiers,
    });

    j(importDeclarationPath).replaceWith(newImport);
  });
};
