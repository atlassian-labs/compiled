# @compiled/webpack-loader

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
