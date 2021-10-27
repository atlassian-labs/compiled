# @compiled/codemods

## 0.2.0

### Minor Changes

- 0ba3ea3: Keep named imports from `styled-components` that are known to be compatible with `@compiled/react` when using the `styled-components-to-compiled` codemod. Currently this only includes the `css` named import.

  **Breaking change:** The `buildImport` plugin API has changed. It now passes an array of specifiers to be added to the created import statement instead of just the `defaultSpecifierName` and `namedImport` strings, making it possible to build statements with multiple imports.

- ba66b35: Add styled-components innerRef to ref codemod

## 0.1.0

### Minor Changes

- a33c65d: New codemod package with plugin system
- 10f4fe9: Update codemod plugin API to include all parameters from jscodeshift
