import type {
  ImportSpecifier,
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
} from 'estree';

/**
 * Builds a string representation of an import declaration.
 *
 * @param innerNodeStr Contents to place between the import brackets
 * @param module Module name to import from
 */
export const buildImportDeclaration = (innerNodeStr: string, module: string): string =>
  `import { ${innerNodeStr} } from '${module}';`;

/**
 * Adds new imports to a pre-existing import declaration and returns its string representation.
 *
 * @param decl Import declaration
 * @param imports Array of strings of imports to add
 */
export const addImportToDeclaration = (decl: ImportDeclaration, imports: string[]): string => {
  const specifiersString = decl.specifiers.map(buildNamedImport).concat(imports).join(', ');
  return buildImportDeclaration(specifiersString, decl.source.value + '');
};

/**
 * Builds a string representation of a named import.
 * If the node has a local name will rebind it to that.
 *
 * @param node
 */
export const buildNamedImport = (
  node: ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier
): string => {
  if (node.type === 'ImportSpecifier') {
    return node.imported.name === node.local.name
      ? node.local.name
      : `${node.imported.name} as ${node.local.name}`;
  }

  return '';
};
