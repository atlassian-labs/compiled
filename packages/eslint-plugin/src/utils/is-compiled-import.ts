import { DEFAULT_IMPORT_SOURCES } from '@compiled/utils';
import type { Rule, Scope } from 'eslint';

import { isStyledImportSpecifier } from './styled-import';

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
    DEFAULT_IMPORT_SOURCES.includes(String(def.parent.source.value));
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

export const isStyled = (node: Node, references: Reference[]): boolean =>
  (node.type === 'MemberExpression' &&
    node.object.type === 'Identifier' &&
    references.some(
      (reference) =>
        reference.identifier === node.object &&
        reference.resolved?.defs.some(isStyledImportSpecifier)
    )) ||
  (node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    references.some(
      (reference) =>
        reference.identifier === node.callee &&
        reference.resolved?.defs.some(isStyledImportSpecifier)
    ));
