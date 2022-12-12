import type { Rule, Scope } from 'eslint';

import { COMPILED_IMPORT } from './constants';

type Definition = Scope.Definition;
type Node = Rule.Node;
type Reference = Scope.Reference;

const isKeyframesImportSpecifier = (def: Definition) =>
  def.node.type === 'ImportSpecifier' &&
  def.node.imported.type === 'Identifier' &&
  def.node.imported.name === 'keyframes' &&
  def.parent?.type === 'ImportDeclaration' &&
  def.parent?.source.value === COMPILED_IMPORT;

export const isKeyframes = (node: Node, references: Reference[]): boolean =>
  node.type === 'Identifier' &&
  references.some(
    (reference) =>
      reference.identifier === node && reference.resolved?.defs.some(isKeyframesImportSpecifier)
  );
