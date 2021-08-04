import { ImportDeclaration, JSCodeshift, Collection } from 'jscodeshift';
import { MigrationTransformer, CodemodPlugin } from './types';

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
}): null => null;

const insertAfterImport = ({}: {
  j: JSCodeshift;
  newImport: Collection<ImportDeclaration>;
}): null => null;

export const migrationTransform: Required<MigrationTransformer> = {
  buildImport,
  insertBeforeImport,
  insertAfterImport,
};

const DefaultCodemodPlugin: Required<CodemodPlugin> = {
  migrationTransform,
};

export default DefaultCodemodPlugin;
