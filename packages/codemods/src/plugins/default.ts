import { ImportDeclaration, JSCodeshift, Collection } from 'jscodeshift';
import { CodemodPlugin } from './contract';

const buildImport = ({
  j,
  currentNode,
  defaultSpecifierName,
  namedImport,
  compiledImportPath,
}: {
  j: JSCodeshift;
  currentNode: ImportDeclaration;
  defaultSpecifierName: string;
  namedImport: string;
  compiledImportPath: string;
}): ImportDeclaration[] => {
  const newImport = j.importDeclaration(
    [j.importSpecifier(j.identifier(namedImport), j.identifier(defaultSpecifierName))],
    j.literal(compiledImportPath)
  );

  // Copy the comments from the previous import to the new one
  newImport.comments = currentNode.comments;
  return [newImport];
};

const insertBeforeImport = ({}: {
  j: JSCodeshift;
  newImport: Collection<ImportDeclaration>;
}): void => {};

const insertAfterImport = ({}: {
  j: JSCodeshift;
  newImport: Collection<ImportDeclaration>;
}): void => {};

const DefaultCodemodPlugin: Required<CodemodPlugin> = {
  buildImport,
  insertBeforeImport,
  insertAfterImport,
};

export default DefaultCodemodPlugin;
