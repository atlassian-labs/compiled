import type { Rule, Scope } from 'eslint';

import { COMPILED_IMPORT, ATLASKIT_IMPORT } from './constants';

type Definition = Scope.Definition;
type Node = Rule.Node;
type Reference = Scope.Reference;
type CompiledNameChecker = (node: Node, references: Reference[]) => boolean;

const isImportSpecifierWrapper = (name: string) => {
  return (def: Definition) =>
    def.node.type === 'ImportSpecifier' &&
    def.node.imported.type === 'Identifier' &&
    def.node.imported.name === name &&
    def.parent?.type === 'ImportDeclaration' &&
    (def.parent.source.value === ATLASKIT_IMPORT || def.parent.source.value === COMPILED_IMPORT);
};

const isCompiledOrAtlaskitImport = (name: string): CompiledNameChecker => {
  const isImportSpecifier = isImportSpecifierWrapper(name);

  return (node: Node, references: Reference[]) =>
    node.type === 'Identifier' &&
    references.some(
      (reference) =>
        reference.identifier === node && reference.resolved?.defs.some(isImportSpecifier)
    );
};

export const isCss = isCompiledOrAtlaskitImport('css');
export const isCxFunction = isCompiledOrAtlaskitImport('cx');
export const isCssMap = isCompiledOrAtlaskitImport('cssMap');
export const isKeyframes = isCompiledOrAtlaskitImport('keyframes');
