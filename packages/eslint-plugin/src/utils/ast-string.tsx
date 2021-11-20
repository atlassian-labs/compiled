import type { ImportSpecifier, ImportDefaultSpecifier, ImportNamespaceSpecifier } from 'estree';

export const buildImportDeclaration = (innerNodeStr: string, module: string): string =>
  `import { ${innerNodeStr} } from '${module}';`;

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
