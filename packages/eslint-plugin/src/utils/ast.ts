import type { TSESTree, TSESLint } from '@typescript-eslint/utils';
import type { Rule } from 'eslint';
import type { ImportDeclaration, ImportSpecifier } from 'estree';

import { COMPILED_IMPORT } from './constants';

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
 * Re-implementation of findCompiledImportDeclarations for typescript-eslint.
 *
 * Given a rule, return any `@compiled/react` import declarations in the source code.
 *
 * @param context Rule context
 * @returns a list of import declarations
 */
export const findTSCompiledImportDeclarations = (
  context: TSESLint.RuleContext<string, readonly unknown[]>
): TSESTree.ImportDeclaration[] => {
  return context
    .getSourceCode()
    .ast.body.filter(
      (node): node is TSESTree.ImportDeclaration =>
        node.type === 'ImportDeclaration' && node.source.value === COMPILED_IMPORT
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

const COMPILED_CSS_IMPORTS: readonly string[] = ['css', 'cssMap'];

/**
 * Given an array of import statements, return whether there are any css and cssMap imports
 * from `@compiled/react`.
 *
 * @param source an array of import declarations
 * @returns whether any Compiled css APIs are being imported from @compiled/react (css, cssMap)
 */
export const usesCompiledCssAPI = (imports: ImportDeclaration[]): boolean => {
  for (const importDeclaration of imports) {
    for (const specifier of importDeclaration.specifiers) {
      if (
        specifier.type === 'ImportSpecifier' &&
        COMPILED_CSS_IMPORTS.includes(specifier.imported.name)
      ) {
        return true;
      }
    }
  }

  return false;
};
