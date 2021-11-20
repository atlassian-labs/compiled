import type { ImportSpecifier, ImportDefaultSpecifier, ImportNamespaceSpecifier } from 'estree';

/**
 * Builds a string representation of an import declaration.
 *
 * @param innerNodeStr Contents to place between the import brackets
 * @param module Module name to import from
 */
export const buildImportDeclaration = (innerNodeStr: string, module: string): string =>
  `import { ${innerNodeStr} } from '${module}';`;

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
