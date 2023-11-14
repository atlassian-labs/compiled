import type { TSESTree, TSESLint } from '@typescript-eslint/utils';
import type { Rule } from 'eslint';
import type { ImportDeclaration, ImportSpecifier } from 'estree';

import { COMPILED_IMPORT } from './constants';

// WARNING
// context.getSourceCode() is deprecated, but we still use it here because
// the newer alternative, context.sourceCode, is not supported below
// ESLint 8.40.
//
// We can replace this with context.sourceCode once we are certain that
// all Compiled users are using ESLint 8.40+.

/**
 * Given a rule, return all imports from the libraries defined in `source`
 * in the file. If `source` is not specified, return all import statements
 * from `@compiled/react`.
 *
 * @param context Rule context
 * @param sources An array containing all the libraries for which we want to
 *   find import statements
 * @returns {Rule.Node} All import statements from `source` (or from
 *   `@compiled/react` by default)
 */
export const findLibraryImportDeclarations = (
  context: Rule.RuleContext,
  sources = [COMPILED_IMPORT]
): ImportDeclaration[] => {
  return context
    .getSourceCode()
    .ast.body.filter(
      (node): node is ImportDeclaration =>
        node.type === 'ImportDeclaration' &&
        typeof node.source.value === 'string' &&
        sources.includes(node.source.value)
    );
};

/**
 * Re-implementation of findLibraryImportDeclarations for typescript-eslint.
 *
 * Given a rule, return all imports from the libraries defined in `source`
 * in the file. If `source` is not specified, return all import statements
 * from `@compiled/react`.
 *
 * @param context Rule context
 * @returns a list of import declarations
 */
export const findTSLibraryImportDeclarations = (
  context: TSESLint.RuleContext<string, readonly unknown[]>,
  sources = [COMPILED_IMPORT]
): TSESTree.ImportDeclaration[] => {
  return context
    .getSourceCode()
    .ast.body.filter(
      (node): node is TSESTree.ImportDeclaration =>
        node.type === 'ImportDeclaration' &&
        typeof node.source.value === 'string' &&
        sources.includes(node.source.value)
    );
};

/**
 * Returns whether the element is a DOM element, which is all lowercase...
 * as opposed to a React component, which is capitalized.
 *
 * @param elementName
 * @returns whether the element is a DOM element (true) or a React component (false)
 */
export const isDOMElement = (elementName: string): boolean =>
  elementName.charAt(0) !== elementName.charAt(0).toUpperCase() &&
  elementName.charAt(0) === elementName.charAt(0).toLowerCase();

/**
 * Traverses up the AST until it reaches a JSXOpeningElement. Used in conjunction with
 * isDOMElement to detect whether the enclosing element is a DOM element or not.
 *
 * @param node
 * @returns a JSXOpeningElement
 */
export const traverseUpToJSXOpeningElement = (node: TSESTree.Node): TSESTree.JSXOpeningElement => {
  while (node.parent && node.type !== 'JSXOpeningElement') {
    return traverseUpToJSXOpeningElement(node.parent);
  }

  if (node.type === 'JSXOpeningElement') {
    return node;
  }

  throw new Error('Could not find JSXOpeningElement');
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

const COMPILED_IMPORTS: readonly string[] = ['css', 'cssMap', 'styled', 'jsx'];

/**
 * Given an array of import statements, return whether there are any Compiled imports
 * from `@compiled/react`.
 *
 * @param source an array of import declarations
 * @returns whether any Compiled APIs are being imported from @compiled/react
 */
export const usesCompiledAPI = (imports: ImportDeclaration[]): boolean => {
  for (const importDeclaration of imports) {
    for (const specifier of importDeclaration.specifiers) {
      if (
        specifier.type === 'ImportSpecifier' &&
        COMPILED_IMPORTS.includes(specifier.imported.name)
      ) {
        return true;
      }
    }
  }

  return false;
};
