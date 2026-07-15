---
'@compiled/babel-plugin': major
'@compiled/css': major
'@compiled/react': major
'@compiled/parcel-transformer': major
'@compiled/webpack-loader': major
'@compiled/vite-plugin': major
---

Remove the unused class name compression feature (`classNameCompressionMap`).

This removes the `classNameCompressionMap` / `classNameCompressionMapFilePath` options across the
babel plugin, CSS transform, and all bundler integrations (Parcel, webpack, Vite), along with the
`ac` runtime (and `clearAcCache`) from `@compiled/react/runtime` and the `generateCompressionMap`
export from `@compiled/css`. Compiled components now always use the `ax` runtime for class name
merging. The feature was unused in practice and its removal simplifies the codebase and reduces
runtime bundle size.
