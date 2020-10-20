import {
  JSCodeshift,
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportSpecifier,
} from 'jscodeshift';
import { Collection } from 'jscodeshift/src/Collection';

export const getImportDeclarationCollection = ({
  j,
  collection,
  importPath,
}: {
  j: JSCodeshift;
  collection: Collection<any>;
  importPath: string;
}) =>
  collection
    .find(j.ImportDeclaration)
    .filter((importDeclarationPath) => importDeclarationPath.node.source.value === importPath);

export const hasImportDeclaration = ({
  j,
  collection,
  importPath,
}: {
  j: JSCodeshift;
  collection: Collection<any>;
  importPath: string;
}) =>
  getImportDeclarationCollection({
    j,
    collection,
    importPath,
  }).length > 0;

export const getImportDefaultSpecifierName = (
  importDefaultSpecifierCollection: Collection<ImportDefaultSpecifier>
) => importDefaultSpecifierCollection.nodes()[0]!.local!.name;

export const getImportSpecifierName = (importSpecifierCollection: Collection<ImportSpecifier>) =>
  importSpecifierCollection.nodes()[0]!.local!.name;

export const findImportSpecifierName = ({
  j,
  importDeclarationCollection,
  importName,
}: {
  j: JSCodeshift;
  importDeclarationCollection: Collection<ImportDeclaration>;
  importName: string;
}) => {
  const importSpecifierCollection = importDeclarationCollection
    .find(j.ImportSpecifier)
    .filter((importSpecifierPath) => importSpecifierPath.node.imported.name === importName);

  if (importSpecifierCollection.length === 0) {
    return null;
  }

  return getImportSpecifierName(importSpecifierCollection);
};

export const buildDefaultImportDeclaration = ({
  j,
  collection,
  importPathFrom,
  importPathTo,
  importPathToName,
}: {
  j: JSCodeshift;
  collection: Collection<any>;
  importPathFrom: string;
  importPathTo: string;
  importPathToName: string;
}) => {
  const importDeclarationCollection = getImportDeclarationCollection({
    j,
    collection,
    importPath: importPathFrom,
  });

  importDeclarationCollection.forEach((importDeclarationPath) => {
    const importDefaultSpecifierCollection = j(importDeclarationPath).find(
      j.ImportDefaultSpecifier
    );

    if (importDefaultSpecifierCollection.length > 0) {
      j(importDeclarationPath).replaceWith([
        j.importDeclaration(
          [
            j.importSpecifier(
              j.identifier(importPathToName),
              j.identifier(getImportDefaultSpecifierName(importDefaultSpecifierCollection))
            ),
          ],
          j.literal(importPathTo)
        ),
      ]);
    }
  });
};
