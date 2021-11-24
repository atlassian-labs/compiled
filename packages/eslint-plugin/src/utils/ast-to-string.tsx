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
 * Adds new imports from an import declaration and returns its string representation.
 *
 * @param decl Import declaration
 * @param imports Array of strings of imports to add
 */
export const addImportToDeclaration = (decl: ImportDeclaration, imports: string[]): string => {
  const specifiersString = decl.specifiers.map(buildNamedImport).concat(imports).join(', ');
  return buildImportDeclaration(specifiersString, decl.source.value + '');
};

/**
 * Removes imports from an import declaration and returns its string representation.
 * If the import was the last declaration will return an empty string.
 *
 * @param decl Import declaration
 * @param imports Array of strings of imports to remove
 */
export const removeImportFromDeclaration = (decl: ImportDeclaration, imports: string[]): string => {
  const specifiersString = decl.specifiers
    .map(buildNamedImport)
    .filter(Boolean)
    .filter((spec) => !imports.includes(spec));

  if (specifiersString.length === 0) {
    return '';
  }

  return buildImportDeclaration(specifiersString.join(', '), decl.source.value + '');
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
