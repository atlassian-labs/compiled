import type { Rule } from 'eslint';
import type { ImportDeclaration, ImportSpecifier } from 'estree';

const COMPILED_IMPORT = '@compiled/react';

/**
 * Given a rule, return any `@compiled/react` nodes in the source being parsed.
 *
 * @param context Rule context
 * @returns {Rule.Node} The `@compiled/react` node or undefined
 */
export const findCompiledImportDeclarations = (context: Rule.RuleContext): ImportDeclaration[] => {
  return context
    .getSourceCode()
    .ast.body.filter(
      (node): node is ImportDeclaration =>
        node.type === 'ImportDeclaration' && node.source.value === COMPILED_IMPORT
    );
};

/**
 * Returns the first declaration that has the import.
 *
 * @param declarations
 * @returns
 */
export const findDeclarationWithImport = (
  declarations: ImportDeclaration[],
  importName: string
): ImportDeclaration | undefined => {
  return declarations.find((imp) =>
    imp.specifiers.find(
      (spec): spec is ImportSpecifier =>
        spec.type === 'ImportSpecifier' && spec.imported.name === importName
    )
  );
};
