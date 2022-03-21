import type { Rule, Scope } from 'eslint';

type Definition = Scope.Definition;
type Node = Rule.Node;
type Reference = Scope.Reference;

const isStyledImportSpecifier = (def: Definition) =>
  def.node.type === 'ImportSpecifier' &&
  def.node.imported.type === 'Identifier' &&
  def.node.imported.name === 'styled' &&
  def.parent?.type === 'ImportDeclaration' &&
  def.parent?.source.value === '@compiled/react';

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
