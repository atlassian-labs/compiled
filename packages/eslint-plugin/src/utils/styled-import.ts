import { COMPILED_IMPORT } from '@compiled/utils';
import type { Scope } from 'eslint';

type Definition = Scope.Definition;

export const isStyledImportSpecifier = (def: Definition): boolean =>
  def.node.type === 'ImportSpecifier' &&
  def.node.imported.type === 'Identifier' &&
  def.node.imported.name === 'styled' &&
  def.parent?.type === 'ImportDeclaration' &&
  def.parent?.source.value === COMPILED_IMPORT;
