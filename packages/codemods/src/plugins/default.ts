import type { ImportDeclaration, JSCodeshift } from 'jscodeshift';
import type { PluginMetadata, MigrationTransformer, CodemodPlugin } from './types';

const buildImport = ({
  j,
  currentNode,
  defaultSpecifierName,
  namedImport,
  compiledImportPath,
}: {
  processedPlugins: Array<PluginMetadata>;
  j: JSCodeshift;
  originalNode: ImportDeclaration;
  currentNode: ImportDeclaration;
  defaultSpecifierName: string;
  namedImport: string;
  compiledImportPath: string;
}): ImportDeclaration => {
  const newImport = j.importDeclaration(
    [j.importSpecifier(j.identifier(namedImport), j.identifier(defaultSpecifierName))],
    j.literal(compiledImportPath)
  );

  // Copy the comments from the previous import to the new one
  newImport.comments = currentNode.comments;

  return newImport;
};

export const migrationTransform: MigrationTransformer = {
  buildImport,
};

const DefaultCodemodPlugin: CodemodPlugin = {
  metadata: { name: 'default' },
  migrationTransform,
};

export default DefaultCodemodPlugin;
