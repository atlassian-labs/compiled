# @compiled/ssr-app

## 1.3.0

### Minor Changes

- c9e45a11: Bump express in SSR example

## 1.2.0

### Minor Changes

- 9a15e742: Sort shorthand properties so that they come before longhand properties.

  When using Compiled, one of the following will happen:

  Option 1. If stylesheet extraction is turned off ("runtime mode"): shorthand properties will be sorted before longhand properties, as long as they are not in a pseudo-selector like `:hover` or `:active`. This is enabled by default and cannot be turned off.

  Option 2. If stylesheet extraction is turned on and one of the below is true:

  - You are using Webpack
  - You are using Parcel AND you are running in production mode

  ... shorthand properties will only be sorted if `sortShorthand: true` is passed to `CompiledExtractPlugin` (Webpack), or `sortShorthand: true` is passed to your Compiled config file like `.compiledcssrc` (Parcel). When sorting shorthand properties using this method (option 2), shorthand properties will always be sorted before longhand properties, taking precedence over pseudo-selectors like `:hover` or `:active`.

### Patch Changes

- Updated dependencies [9a15e742]
  - @compiled/react@0.18.0

## 1.1.0

### Minor Changes

- a41e41e6: Update monorepo node version to v18, and drop support for node v12

### Patch Changes

- Updated dependencies [a41e41e6]
- Updated dependencies [f9c957ef]
  - @compiled/react@0.12.0

## 1.0.14

### Patch Changes

- 4877ec38: Bump babel versions
- Updated dependencies [acd89969]
  - @compiled/react@0.11.3

## 1.0.13

### Patch Changes

- 356b120: Apply react/jsx-filename-extension rule as needed
- Updated dependencies [356b120]
  - @compiled/react@0.10.4

## 1.0.12

### Patch Changes

- Updated dependencies [47050f4]
  - @compiled/react@0.10.3

## 1.0.11

### Patch Changes

- 6233199: resolve Razzle peer dependency to solve node-forge vulnerability

## 1.0.10

### Patch Changes

- Updated dependencies [254a6f6]
- Updated dependencies [c757259]
- Updated dependencies [6649528]
  - @compiled/react@0.10.2

## 1.0.9

### Patch Changes

- Updated dependencies [d3e257c]
- Updated dependencies [8c9ab8c]
- Updated dependencies [8c9ab8c]
- Updated dependencies [8c9ab8c]
  - @compiled/react@0.10.1

## 1.0.8

### Patch Changes

- Updated dependencies [427cead]
- Updated dependencies [79cfb08]
  - @compiled/react@0.10.0

## 1.0.7

### Patch Changes

- Updated dependencies [4309aaa]
  - @compiled/react@0.9.1

## 1.0.6

### Patch Changes

- Updated dependencies [2092839]
  - @compiled/react@0.9.0

## 1.0.5

### Patch Changes

- Updated dependencies [4210ff6]
- Updated dependencies [53935b3]
  - @compiled/react@0.8.0

## 1.0.4

### Patch Changes

- Updated dependencies [bcb2a68]
- Updated dependencies [a7ab8e1]
  - @compiled/react@0.7.0

## 1.0.3

### Patch Changes

- Updated dependencies [13c3a60]
  - @compiled/react@0.6.13

## 1.0.2

### Patch Changes

- Updated dependencies [b5b4e8a]
  - @compiled/react@0.6.12

## 1.0.1

### Patch Changes

- Updated dependencies [ee3363e]
  - @compiled/react@0.6.11
