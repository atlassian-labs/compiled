# @compiled/codemods

## 0.4.0

### Minor Changes

- 9a1a74d: Move attrs transformation after applyVisitor

## 0.3.4

### Patch Changes

- 254a6f6: Added ESLint rule to prevent use of extraneous packages, and added these usages of these packages as dependencies. Added new namespace `@compiled-private` to prevent name clashes with existing npm packages.
- c757259: Update type definition dependencies

## 0.3.3

### Patch Changes

- 8c9ab8c: Update `homepage` and other `package.json` properties

## 0.3.2

### Patch Changes

- 79cfb08: Internal refactor changing how the TypeScript compiler picks up source files.

## 0.3.1

### Patch Changes

- b6263ae: Add support for `keyframes` import from `@emotion/core` and `@emotion/react` with alphabetical sorting

## 0.3.0

### Minor Changes

- f12c08d: Add support for `keyframes` import with alphabetical sorting

### Patch Changes

- 507bcad: Minor change to account for css() usage in the emotion codemod.

## 0.2.0

### Minor Changes

- 0ba3ea3: Keep named imports from `styled-components` that are known to be compatible with `@compiled/react` when using the `styled-components-to-compiled` codemod. Currently this only includes the `css` named import.

  **Breaking change:** The `buildImport` plugin API has changed. It now passes an array of specifiers to be added to the created import statement instead of just the `defaultSpecifierName` and `namedImport` strings, making it possible to build statements with multiple imports.

- ba66b35: Add styled-components innerRef to ref codemod

## 0.1.0

### Minor Changes

- a33c65d: New codemod package with plugin system
- 10f4fe9: Update codemod plugin API to include all parameters from jscodeshift
