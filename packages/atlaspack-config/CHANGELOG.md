# @compiled/parcel-config

## 0.5.5

### Patch Changes

- Updated dependencies [f63b99d4]
  - @compiled/parcel-optimizer@0.6.0
  - @compiled/parcel-transformer@0.18.1

## 0.5.4

### Patch Changes

- Updated dependencies [c1655312]
- Updated dependencies [c1655312]
  - @compiled/parcel-transformer@0.18.0

## 0.5.3

### Patch Changes

- Updated dependencies [4fb5c6e1]
- Updated dependencies [2750e288]
  - @compiled/parcel-transformer@0.17.0
  - @compiled/parcel-optimizer@0.5.1

## 0.5.2

### Patch Changes

- Updated dependencies [9a15e742]
  - @compiled/parcel-optimizer@0.5.0
  - @compiled/parcel-transformer@0.16.2

## 0.5.1

### Patch Changes

- Updated dependencies [a0f8c897]
  - @compiled/parcel-transformer@0.16.0

## 0.5.0

### Minor Changes

- 83c47f85: [BREAKING] Add a deterministic sorting to media queries and other at-rules in Compiled. We use a simplified version of what the [`sort-css-media-queries`](https://github.com/OlehDutchenko/sort-css-media-queries?tab=readme-ov-file#mobile-first) package does - sorting `min-width` and `min-height` from smallest to largest, then `max-width` and `max-height` from largest to smallest. If ranges or features involving `height` and `width` are not present in the at-rule, the at-rule will be sorted lexicographically / alphabetically.

  Situations you may need to be careful of:

  - In situations where two at-rules with the same property apply at the same time, this may break your styles, as the order in which the styles are applied will change. (For example, overlapping `@media` queries)
  - Because all at-rules will now be sorted lexicographically / alphabetically, `@layer` blocks you pass to Compiled APIs may not be outputted in the same order, causing different CSS than expected.

  This is turned on by default. If you do not want your at-rules to be sorted, set `sortAtRules` to `false` in your configuration:

  - Webpack users: the `@compiled/webpack-loader` options in your Webpack configuration
  - Parcel users: your Compiled configuration, e.g. `.compiledcssrc` or similar
  - Babel users: the `@compiled/babel-plugin-strip-runtime` options in your `.babelrc.json` or similar, if you have the `@compiled/babel-plugin-strip-runtime` plugin enabled.

### Patch Changes

- Updated dependencies [4f5865a1]
  - @compiled/parcel-transformer@0.15.4
  - @compiled/parcel-optimizer@0.4.5

## 0.4.0

### Minor Changes

- 0666530c: Add new parcel transformer for distributed Compiled code

### Patch Changes

- Updated dependencies [0666530c]
  - @compiled/parcel-transformer-external@0.1.0
  - @compiled/parcel-transformer@0.15.0

## 0.3.2

### Patch Changes

- Updated dependencies [809cc389]
  - @compiled/parcel-transformer@0.14.0

## 0.3.1

### Patch Changes

- Updated dependencies [c4e6b7c0]
- Updated dependencies [89c5d043]
  - @compiled/parcel-transformer@0.13.0
  - @compiled/parcel-optimizer@0.4.0

## 0.3.0

### Minor Changes

- a41e41e6: Update monorepo node version to v18, and drop support for node v12

### Patch Changes

- Updated dependencies [a41e41e6]
- Updated dependencies [f9c957ef]
  - @compiled/parcel-optimizer@0.3.0
  - @compiled/parcel-transformer@0.12.0

## 0.2.0

### Minor Changes

- 966a1080: Changed the approach of stylesheet extraction on Parcel

  - @compiled/parcel-resolver is no longer used
  - Pass styleRules to optimizer via metadata
  - Optimizer then collects styleRules, and inserts it to output HTML

### Patch Changes

- Updated dependencies [966a1080]
  - @compiled/parcel-optimizer@0.2.0
  - @compiled/parcel-transformer@0.11.0

## 0.1.3

### Patch Changes

- Updated dependencies [100f5d5e]
  - @compiled/parcel-transformer@0.10.0

## 0.1.2

### Patch Changes

- e9b0015: Include config.json in package release
- Updated dependencies [e1ac2ed]
- Updated dependencies [e93ed68]
  - @compiled/parcel-transformer@0.9.0

## 0.1.1

### Patch Changes

- 5f231e5: Support stylesheet extraction with Parcel
- Updated dependencies [5f231e5]
  - @compiled/parcel-transformer@0.8.0
  - @compiled/parcel-optimizer@0.1.1
  - @compiled/parcel-resolver@0.1.1
