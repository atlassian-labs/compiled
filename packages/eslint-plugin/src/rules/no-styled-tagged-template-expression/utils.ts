import type { Rule, Scope } from 'eslint';

import { isStyledImportSpecifier } from '../../utils/styled-import';

type Node = Rule.Node;
type Reference = Scope.Reference;

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
