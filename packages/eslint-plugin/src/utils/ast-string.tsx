import type { ImportSpecifier } from 'estree';

export const wrapImport = (node: string, module: string): string =>
  `import { ${node} } from '${module}';`;

export const getNamedImports = (node: ImportSpecifier): string => {
  return node.imported.name === node.local.name
    ? node.local.name
    : `${node.imported.name} as ${node.local.name}`;
};
