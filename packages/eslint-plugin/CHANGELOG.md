# @compiled/eslint-plugin

## 0.4.3

### Patch Changes

- 10533c7f: Add Type support to no-styled-tagged-template-expression ESLint rule

## 0.4.2

### Patch Changes

- c8371532: Handle whole module imports

## 0.4.1

### Patch Changes

- 6e92764: Fix no-exported-css and no-exported-keyframes errors within components

## 0.4.0

### Minor Changes

- a57d3be: Add no-exported-css and no-exported-keyframes rules

## 0.3.0

### Minor Changes

- 5d699ed: Add no-tagged-template-expression rules for each API

### Patch Changes

- 356b120: Apply react/jsx-filename-extension rule as needed

## 0.2.2

### Patch Changes

- 8c9ab8c: Adds url to lint rules
- 8c9ab8c: Update `homepage` and other `package.json` properties

## 0.2.1

### Patch Changes

- dedadbb: The `jsx-pragma` rule now removes the default react import when moving to the automatic runtime and it isn't used.

## 0.2.0

### Minor Changes

- f203635: Renames `emotion-to-compiled` rule to `no-emotion-css`.

### Patch Changes

- f203635: The `no-emotion-css` rule now keeps the jsx pragma around if defined.
- f203635: The `no-emotion-css` rule now will check for `jsxImportSource` pragma usage with a supplementary fixer.
- 1a9e503: Adds `jsx-pragma` rule,
  useful when working with the `css` prop.
  When enabled it will error when the jsx pragma is missing or when using the wrong pragma for the configured runtime.
- 79cfb08: Package now built with project references.
- 79cfb08: Internal refactor changing how the TypeScript compiler picks up source files.

## 0.1.0

### Minor Changes

- 507bcad: Initial release of the `@compiled/eslint-plugin`. This will become a useful complementary tool to use with the `@compiled` library.
