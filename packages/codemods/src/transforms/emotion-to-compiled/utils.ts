import type {
  Collection,
  ImportDeclaration,
  JSCodeshift,
  Node,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
  ImportSpecifier,
} from 'jscodeshift';

import { COMPILED_IMPORT_PATH, REACT_IMPORT_NAME, REACT_IMPORT_PATH } from '../../constants';
import { getImportDeclarationCollection, hasImportDeclaration } from '../../utils';

export const addReactIdentifier = ({
  j,
  collection,
}: {
  j: JSCodeshift;
  collection: Collection<Node>;
}): void => {
  const hasReactImportDeclaration: boolean = hasImportDeclaration({
    collection,
    importPath: REACT_IMPORT_PATH,
    j,
  });

  if (!hasReactImportDeclaration) {
    collection.find(j.Program).forEach((programPath) => {
      programPath.node.body.unshift(
        j.importDeclaration(
          [j.importNamespaceSpecifier(j.identifier(REACT_IMPORT_NAME))],
          j.literal(REACT_IMPORT_PATH)
        )
      );
    });
  } else {
    const importDeclarationCollection: Collection<ImportDeclaration> =
      getImportDeclarationCollection({
        collection,
        importPath: REACT_IMPORT_PATH,
        j,
      });

    importDeclarationCollection.forEach((importDeclarationPath) => {
      const importDefaultSpecifierCollection: Collection<ImportDefaultSpecifier> = j(
        importDeclarationPath
      ).find(j.ImportDefaultSpecifier);
      const importNamespaceSpecifierCollection: Collection<ImportNamespaceSpecifier> = j(
        importDeclarationPath
      ).find(j.ImportNamespaceSpecifier);

      const hasNoDefaultReactImportDeclaration = importDefaultSpecifierCollection.length === 0;
      const hasNoNamespaceReactImportDeclaration = importNamespaceSpecifierCollection.length === 0;

      if (
        hasNoDefaultReactImportDeclaration &&
        hasNoNamespaceReactImportDeclaration &&
        importDeclarationPath.node.specifiers
      ) {
        importDeclarationPath.node.specifiers.unshift(
          j.importDefaultSpecifier(j.identifier(REACT_IMPORT_NAME))
        );
      }
    });
  }
};

const getImportSpecifierName = (
  importSpecifierCollection: Collection<ImportSpecifier>
): string | undefined => importSpecifierCollection.nodes()[0]!.local!.name;

export const findImportSpecifierName = ({
  j,
  importDeclarationCollection,
  importName,
}: {
  j: JSCodeshift;
  importDeclarationCollection: Collection<ImportDeclaration>;
  importName: string;
}): string | null | undefined => {
  const importSpecifierCollection: Collection<ImportSpecifier> = importDeclarationCollection
    .find(j.ImportSpecifier)
    .filter((importSpecifierPath) => importSpecifierPath.node.imported.name === importName);

  if (importSpecifierCollection.length === 0) {
    return null;
  }

  return getImportSpecifierName(importSpecifierCollection);
};

export const mergeImportSpecifiers = ({
  j,
  collection,
  filter = (_) => true,
}: {
  j: JSCodeshift;
  collection: Collection<Node>;
  filter?: (name: string | undefined) => boolean;
}): void => {
  const importDeclarationCollection: Collection<ImportDeclaration> = getImportDeclarationCollection(
    {
      collection,
      importPath: COMPILED_IMPORT_PATH,
      j,
    }
  );

  const importSpecifiers: ImportSpecifier[] = [];

  importDeclarationCollection
    .find(j.ImportSpecifier)
    .filter((importSpecifierPath) => filter(importSpecifierPath.node.imported.name))
    .forEach((importSpecifierPath) => {
      importSpecifiers.push(importSpecifierPath.node);
    });

  const importDeclarationCollectionLength = importDeclarationCollection.length;
  const importDeclarationComments: Node['comments'] = [];

  importDeclarationCollection.forEach((importDeclarationPath, index) => {
    const oldNode = importDeclarationPath.node;
    const { comments } = oldNode;

    if (comments) {
      importDeclarationComments.push(...comments);
    }

    if (index === importDeclarationCollectionLength - 1) {
      j(importDeclarationPath).replaceWith([
        j.importDeclaration(importSpecifiers, j.literal(COMPILED_IMPORT_PATH)),
      ]);

      const newNode = importDeclarationPath.node;

      if (newNode !== oldNode) {
        newNode.comments = importDeclarationComments;
      }
    } else {
      j(importDeclarationPath).remove();
    }
  });
};
