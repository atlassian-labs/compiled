---
'@compiled/webpack-loader': patch
---

Added new option `extract` with pairing webpack plugin `CompiledExtractPlugin`.
Configuring them will strip all the runtime from your app and extract all styles to an atomic style sheet.

For help getting started with this feature read the [CSS extraction guide](https://compiledcssinjs.com/docs/css-extraction-webpack) for webpack.
