import type { Collection, ImportDeclaration, JSCodeshift } from 'jscodeshift';

export const getImportDeclarationCollection = ({
  j,
  collection,
  importPath,
}: {
  j: JSCodeshift;
  collection: Collection<any>;
  importPath: string;
}): Collection<ImportDeclaration> => {
  const found: Collection<ImportDeclaration> = collection
    .find(j.ImportDeclaration)
    .filter((importDeclarationPath) => importDeclarationPath.node.source.value === importPath);

  return found;
};

export const hasImportDeclaration = ({
  j,
  collection,
  importPath,
}: {
  j: JSCodeshift;
  collection: Collection<any>;
  importPath: string;
}): boolean => {
  const result: Collection<ImportDeclaration> = getImportDeclarationCollection({
    collection,
    importPath,
    j,
  });

  return result.length > 0;
};
