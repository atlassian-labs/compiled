# @compiled/webpack-loader

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
