# @compiled/webpack-loader

## 0.8.0

### Minor Changes

- 858146c: Add babel plugins support

### Patch Changes

- Updated dependencies [b0adb8a]
- Updated dependencies [f139218]
- Updated dependencies [858146c]
- Updated dependencies [b0adb8a]
  - @compiled/babel-plugin@0.12.0

## 0.7.6

### Patch Changes

- 254a6f6: Added ESLint rule to prevent use of extraneous packages, and added these usages of these packages as dependencies. Added new namespace `@compiled-private` to prevent name clashes with existing npm packages.
- 63148ec: Support file importing in babel plugin and add configuration in loaders
- Updated dependencies [254a6f6]
- Updated dependencies [c757259]
- Updated dependencies [6649528]
- Updated dependencies [63148ec]
  - @compiled/babel-plugin@0.11.4
  - @compiled/react@0.10.2
  - @compiled/babel-plugin-strip-runtime@0.11.4
  - @compiled/css@0.8.1

## 0.7.5

### Patch Changes

- b345bf4: Update dependencies and plugins to use postcss v8
- Updated dependencies [3b7c188]
- Updated dependencies [c2ae4eb]
- Updated dependencies [b345bf4]
  - @compiled/babel-plugin@0.11.3
  - @compiled/css@0.8.0
  - @compiled/utils@0.6.14

## 0.7.4

### Patch Changes

- 8c9ab8c: Update `homepage` and other `package.json` properties
- Updated dependencies [8c9ab8c]
- Updated dependencies [1ca19be]
  - @compiled/babel-plugin@0.11.2
  - @compiled/babel-plugin-strip-runtime@0.11.2
  - @compiled/css@0.7.2
  - @compiled/utils@0.6.13

## 0.7.3

### Patch Changes

- 427cead: Compiled now supports turning on the `css` prop using jsx pragmas (both with `@jsx` and `@jsxImportSource`).
- 79cfb08: Internal refactor changing how the TypeScript compiler picks up source files.
- 79cfb08: Compiled's CSS loader now uses referential equality instead of pathname to determine if it needs to re-order itself from the last to first.
- Updated dependencies [79cfb08]
- Updated dependencies [14368bb]
- Updated dependencies [68ebac3]
- Updated dependencies [427cead]
- Updated dependencies [79cfb08]
  - @compiled/babel-plugin@0.11.1
  - @compiled/babel-plugin-strip-runtime@0.11.1
  - @compiled/css@0.7.1
  - @compiled/utils@0.6.12

## 0.7.2

### Patch Changes

- Updated dependencies [e015a3a]
- Updated dependencies [fa6af90]
  - @compiled/babel-plugin@0.11.0

## 0.7.1

### Patch Changes

- Updated dependencies [b68411c]
- Updated dependencies [53a3d71]
  - @compiled/babel-plugin@0.10.0

## 0.7.0

### Minor Changes

- 0b60ae1: Use webpack resolution and add custom `resolve` override

### Patch Changes

- Updated dependencies [0b60ae1]
- Updated dependencies [2092839]
  - @compiled/babel-plugin@0.9.0

## 0.6.17

### Patch Changes

- Updated dependencies [53935b3]
  - @compiled/babel-plugin@0.8.0

## 0.6.16

### Patch Changes

- Updated dependencies [bcb2a68]
- Updated dependencies [a7ab8e1]
- Updated dependencies [e1dc346]
- Updated dependencies [bcb2a68]
- Updated dependencies [48805ec]
- Updated dependencies [587e729]
  - @compiled/babel-plugin@0.7.0
  - @compiled/css@0.7.0

## 0.6.15

### Patch Changes

- 40bc0d9: Package descriptions have been updated.
- Updated dependencies [40bc0d9]
- Updated dependencies [1b1c964]
- Updated dependencies [1b1c964]
  - @compiled/babel-plugin@0.6.13
  - @compiled/babel-plugin-strip-runtime@0.6.13
  - @compiled/css@0.6.11
  - @compiled/utils@0.6.11

## 0.6.14

### Patch Changes

- ad512ec: Fixed extraction when `!important` styles were found.

## 0.6.13

### Patch Changes

- 6a7261e: Programmatic babel use now searches upwards for a project root, and if found will use that config. This fixes issues in some monorepo setups.
- 8a13ee9: The loader now only errors once when running without the webpack extract plugin.
- Updated dependencies [b92eb6d]
  - @compiled/babel-plugin-strip-runtime@0.6.11

## 0.6.12

### Patch Changes

- 4032cd4: The `importReact` option now correctly defaults to `true`.

## 0.6.11

### Patch Changes

- 37108e4: Fixed webpack 4 flow throwing unexpectedly.
- 37108e4: Added missing babel dependency.
- 37108e4: Fixed css loader entrypoint not making its way to npm.
- 37108e4: Compiled dependencies are now using carat range.
- 37108e4: Fixed bug picking up an unexpected asset during webpack compilation.
- Updated dependencies [992e401]
- Updated dependencies [37108e4]
  - @compiled/utils@0.6.10
  - @compiled/babel-plugin@0.6.10
  - @compiled/css@0.6.10

## 0.6.10

### Patch Changes

- 660309a: Support for webpack 4 has been added, follow the [extraction guide](https://compiledcssinjs.com/docs/css-extraction-webpack) to get started.

## 0.6.9

### Patch Changes

- 0bb1c11: Added new option `extract` with pairing webpack plugin `CompiledExtractPlugin`.
  Configuring them will strip all the runtime from your app and extract all styles to an atomic style sheet.

  For help getting started with this feature read the [CSS extraction guide](https://compiledcssinjs.com/docs/css-extraction-webpack) for webpack.

- Updated dependencies [0bb1c11]
- Updated dependencies [0bb1c11]
  - @compiled/css@0.6.9
  - @compiled/utils@0.6.9
  - @compiled/babel-plugin@0.6.9

## 0.6.8

### Patch Changes

- aea3504: Packages now released with [changesets](https://github.com/atlassian/changesets).
- Updated dependencies [aea3504]
  - @compiled/babel-plugin@0.6.8
