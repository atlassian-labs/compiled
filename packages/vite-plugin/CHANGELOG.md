# @compiled/vite-plugin

## 2.0.2

### Patch Changes

- 98fa5d8: Forward the `collisionResistantHash` option through to `@compiled/babel-plugin`.

  This is a follow-up to [#1920](https://github.com/atlassian-labs/compiled/pull/1920), which introduced the `collisionResistantHash` option in `@compiled/babel-plugin` and `@compiled/css` but did not expose it on the `@compiled/webpack-loader` option surface — so the webpack/rspack build path could not enable it. The option is now part of `CompiledLoaderOptions`, the loader schema, and the options passed to the babel plugin.

  `@compiled/vite-plugin` already forwarded user-supplied options to the babel plugin (its options type extends the babel-plugin options), so this was already functional; `collisionResistantHash` is now added to its explicit defaults list and package docs for consistency and discoverability.

## 2.0.1

### Patch Changes

- Updated dependencies [b0dacb1]
  - @compiled/babel-plugin@2.0.0
  - @compiled/css@2.0.0
  - @compiled/utils@0.14.0
  - @compiled/babel-plugin-strip-runtime@2.0.0

## 2.0.0

### Major Changes

- f34e80d: Remove the unused class name compression feature (`classNameCompressionMap`).

  This removes the `classNameCompressionMap` / `classNameCompressionMapFilePath` options across the
  babel plugin, CSS transform, and all bundler integrations (Parcel, webpack, Vite), along with the
  `ac` runtime (and `clearAcCache`) from `@compiled/react/runtime` and the `generateCompressionMap`
  export from `@compiled/css`. Compiled components now always use the `ax` runtime for class name
  merging. The feature was unused in practice and its removal simplifies the codebase and reduces
  runtime bundle size.

### Patch Changes

- Updated dependencies [f34e80d]
  - @compiled/babel-plugin@1.0.0
  - @compiled/css@1.0.0
  - @compiled/babel-plugin-strip-runtime@1.0.0

## 1.1.6

### Patch Changes

- a03b34a: Make extracted CSS deterministic and preserve `cssMapScoped` source order across all supported bundlers.

  - `@compiled/babel-plugin-strip-runtime`: batch `unshiftContainer` so emitted `require()` statements preserve `styleRules` source order, and partition non-atomic vs atomic rules when writing extracted CSS files via `sortStyleRulesForDeterministicOutput`.
  - `@compiled/parcel-optimizer`: collect rules per asset, sort assets by `filePath` for cross-file determinism, then partition non-atomic vs atomic rules.
  - `@compiled/vite-plugin`: collect rules per source file (Map keyed by `filePath`), sort by `filePath` for cross-file determinism, then partition.
  - `@compiled/webpack-loader`: sort emitted CSS assets by name for deterministic output.
  - `@compiled/react`: fix `isNonAtomicSheet` to use `includes` instead of `startsWith` so at-rule-wrapped non-atomic rules (`@media`, `@container`) are correctly bucketed at runtime.

- Updated dependencies [a03b34a]
  - @compiled/babel-plugin-strip-runtime@0.40.1

## 1.1.5

### Patch Changes

- Updated dependencies [60932d8]
  - @compiled/babel-plugin@0.40.0
  - @compiled/css@0.22.0
  - @compiled/babel-plugin-strip-runtime@0.40.0

## 1.1.4

### Patch Changes

- Updated dependencies [6429bfe]
  - @compiled/babel-plugin@0.39.0

## 1.1.3

### Patch Changes

- a4c1ee8: Fix #1861 by adding extensions into @compiled/vite-plugin and @compiled/react packages to fix ESM support.

## 1.1.2

### Patch Changes

- 86ff4e8: Fix vite-plugin with ESM (`v1.1.1` was a broken version for proper ESM)

## 1.1.1

### Patch Changes

- f54b4c9: Fix ESM support with require() call now that we distribute multiple versions

## 1.1.0

### Minor Changes

- 117eb47: Bump package dependencies to React 18 globally. Replace jsx and jsx-dev runtimes with modern syntax to circumvent `export \*` issues.

### Patch Changes

- 117eb47: Split CJS and ESM exports for the Vite Plugin

## 1.0.0

### Major Changes

- 979ad9d: Add new Vite plugin
