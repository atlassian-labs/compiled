# @compiled/eslint-plugin

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
