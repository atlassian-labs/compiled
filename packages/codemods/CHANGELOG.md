# @compiled/codemods

## 0.9.5

### Patch Changes

- Updated dependencies [9a15e742]
- Updated dependencies [9a15e742]
  - @compiled/utils@0.12.0

## 0.9.4

### Patch Changes

- 4f5865a1: Fixes the parsing of custom properties (CSS variables) names in object syntax. The casing is now preserved instead of being converted to kebab-case.
- Updated dependencies [4f5865a1]
  - @compiled/utils@0.11.1

## 0.9.3

### Patch Changes

- Updated dependencies [04cb7ae7]
  - @compiled/utils@0.11.0

## 0.9.2

### Patch Changes

- Updated dependencies [e49b4f08]
  - @compiled/utils@0.10.0

## 0.9.1

### Patch Changes

- Updated dependencies [fbc17ed3]
  - @compiled/utils@0.9.0

## 0.9.0

### Minor Changes

- c4e6b7c0: Change TypeScript compiler target from es5 to es6.

### Patch Changes

- Updated dependencies [c4e6b7c0]
  - @compiled/utils@0.8.0

## 0.8.0

### Minor Changes

- a41e41e6: Update monorepo node version to v18, and drop support for node v12

### Patch Changes

- Updated dependencies [a41e41e6]
  - @compiled/utils@0.7.0

## 0.7.1

### Patch Changes

- dbf4262f: Preserve original node in build import API for codemods

## 0.7.0

### Minor Changes

- 9673582b: Preserve unresolved imports in codemods instead of removing and adding a comment

## 0.6.0

### Minor Changes

- 16f4d45: Adds Codeshift configuration file as an alternate codemod runner.

### Patch Changes

- 1018a26: Adds codeshift.config.js to the NPM allow list so it is accessible by the @codeshift/cli at runtime

## 0.5.0

### Minor Changes

- c3f4ad2: Add a plugin for tagged template expressions

### Patch Changes

- 356b120: Apply react/jsx-filename-extension rule as needed
- Updated dependencies [356b120]
  - @compiled/utils@0.6.16

## 0.4.2

### Patch Changes

- d42e1a0: Resolve unset-values to ^2.0.0 to mitigate vulnerability
- e2199fa: Bump trim-newlines to v3.0.1

## 0.4.1

### Patch Changes

- 8aff883: Add codemod support for inline comments.

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
