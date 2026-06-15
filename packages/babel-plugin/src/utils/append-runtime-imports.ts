import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

import type { State } from '../types';

/**
 * Wrapper to make defining import specifiers easier.
 * If `localName` is defined it will rename the import to it,
 * e.g: `name as localName`.
 *
 * @param name import name
 * @param localName local name
 */
const importSpecifier = (name: string, localName?: string): t.ImportSpecifier => {
  return t.importSpecifier(t.identifier(name), t.identifier(localName || name));
};

// Runtime function `ac` is less performant than `ax`, so we only want to import `ac` if classNameCompressionMap is provided.
const COMPILED_RUNTIME_IMPORTS_WITH_COMPRESSION = ['ac', 'ix', 'CC', 'CS'];
const COMPILED_RUNTIME_IMPORTS_WITHOUT_COMPRESSION = ['ax', 'ix', 'CC', 'CS'];
const COMPILED_RUNTIME_MODULE = '@compiled/react/runtime';

// Vanilla mode is React-free: there is no JSX wrapper, so neither `CC` nor
// `CS` is needed. `ix` is omitted because vanilla `cssMap` does not support
// dynamic CSS variable interpolation today (the runtime helper for that lives
// in `@compiled/react/runtime` and is JSX-shaped). When dynamic interpolation
// is added to vanilla, `ix` should be re-introduced here.
const COMPILED_VANILLA_RUNTIME_IMPORTS = ['ax', 'insertSheets'];
const COMPILED_VANILLA_RUNTIME_MODULE = '@compiled/vanilla/runtime';

/**
 * Appends runtime import to code. If it is already present, it will append import specifiers
 * to already imported declaration path else it will create fresh import declaration path
 * with runtime import specifiers.
 *
 * In vanilla mode imports are sourced from `@compiled/vanilla/runtime` and the
 * specifier set is reduced to `ax` (className merging) plus `insertSheets`
 * (the helper that inserts the generated sheets into the document head).
 *
 * @param path ImportDeclaration node path
 */
export const appendRuntimeImports = (path: NodePath<t.Program>, state: State): void => {
  const runtimeModule = state.isVanilla ? COMPILED_VANILLA_RUNTIME_MODULE : COMPILED_RUNTIME_MODULE;

  const runtimeImports = state.isVanilla
    ? COMPILED_VANILLA_RUNTIME_IMPORTS
    : state.opts.classNameCompressionMap
    ? COMPILED_RUNTIME_IMPORTS_WITH_COMPRESSION
    : COMPILED_RUNTIME_IMPORTS_WITHOUT_COMPRESSION;

  // Check if we have any sibling runtime import
  const previouslyDeclaredRuntimeDeclaration = path
    .get('body')
    .find((childPath): childPath is NodePath<t.ImportDeclaration> => {
      return t.isImportDeclaration(childPath.node) && childPath.node.source.value === runtimeModule;
    });

  if (previouslyDeclaredRuntimeDeclaration) {
    /**
     * Get local import name instead of imported name to handle scenario when
     * import specifier is imported as named and normal both.
     *
     * eg. import { CC as CompiledRoot, ax, CC, CS } from '@compiled/react/runtime';
     * In above example `CC` is used both as `CompiledRoot` and `CC`.
     */
    const localImportNames = previouslyDeclaredRuntimeDeclaration
      .get('specifiers')
      .map((specifier) => specifier.node.local.name);

    runtimeImports.forEach((runtimeImportName) => {
      // Avoids duplicate imports from being appended if already present
      if (!localImportNames.includes(runtimeImportName)) {
        previouslyDeclaredRuntimeDeclaration.pushContainer(
          'specifiers',
          importSpecifier(runtimeImportName)
        );
      }
    });
  } else {
    // Add the runtime entrypoint module
    path.unshiftContainer(
      'body',
      t.importDeclaration(
        runtimeImports.map((runtimeImportName) => importSpecifier(runtimeImportName)),
        t.stringLiteral(runtimeModule)
      )
    );
  }
};
