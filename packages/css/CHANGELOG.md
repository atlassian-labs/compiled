# @compiled/css

## 0.12.3

### Patch Changes

- e49b4f08: Use a shared utils version of INCREASE_SPECIFICITY_SELECTOR
- Updated dependencies [e49b4f08]
  - @compiled/utils@0.10.0

## 0.12.2

### Patch Changes

- 5bd1b492: Introduce a new config option `increaseSpecificity` that increases the specificity of all generated Compiled classes. This is useful when migrating between two or more other styling solutions to Compiled.

## 0.12.1

### Patch Changes

- Updated dependencies [fbc17ed3]
  - @compiled/utils@0.9.0

## 0.12.0

### Minor Changes

- a24c157c: Skip expansion of shorthand properties (e.g. padding, margin) if they have dynamic values (e.g. CSS variables, ternary expressions, arrow functions)

## 0.11.0

### Minor Changes

- c4e6b7c0: Change TypeScript compiler target from es5 to es6.

### Patch Changes

- Updated dependencies [c4e6b7c0]
  - @compiled/utils@0.8.0

## 0.10.0

### Minor Changes

- f9005e2b: Add support for all CSS at-rules, and forbid at-rules for which atomic CSS wouldn't make sense (@charset, @import, @namespace)

### Patch Changes

- 488deaa6: Add support for unitless values for base-palette, font-size-adjust, and -webkit-line-clamp properties

## 0.9.0

### Minor Changes

- a41e41e6: Update monorepo node version to v18, and drop support for node v12
- f9c957ef: Add an option to compress class names based on "classNameCompressionMap", which is provided by library consumers.
  Add a script to generate compressed class names.

### Patch Changes

- Updated dependencies [a41e41e6]
  - @compiled/utils@0.7.0

## 0.8.10

### Patch Changes

- ba68bc7f: Fix transparent and currentcolor not being treated as a color

## 0.8.9

### Patch Changes

- b696cd24: Bumping postcss packages

## 0.8.8

### Patch Changes

- e887c2b5: Clean up dependencies of packages
- Updated dependencies [e887c2b5]
- Updated dependencies [4877ec38]
  - @compiled/utils@0.6.17

## 0.8.7

### Patch Changes

- fd9c9be9: Fix flex shorthand expansion when flex basis is 0

## 0.8.6

### Patch Changes

- 8a74fcd7: Default flex-basis to 0% when expanding flex

## 0.8.5

### Patch Changes

- 17de9d1f: Omit rules with empty values from stylesheet

## 0.8.4

### Patch Changes

- 5272281a: Add configurable options to optimize CSS

## 0.8.3

### Patch Changes

- ad4d257: Update TypeScript and Flow types to support function calls and resolve incorrect typing
- 8384893: Fix flex shorthand expansion not following CSS specification

## 0.8.2

### Patch Changes

- 356b120: Apply react/jsx-filename-extension rule as needed
- Updated dependencies [356b120]
  - @compiled/utils@0.6.16

## 0.8.1

### Patch Changes

- c757259: Update type definition dependencies
- 63148ec: Support file importing in babel plugin and add configuration in loaders

## 0.8.0

### Minor Changes

- b345bf4: Update dependencies and plugins to use postcss v8

### Patch Changes

- c2ae4eb: Resolve css-what and nth-check to new versions in @compiled/css
- Updated dependencies [b345bf4]
  - @compiled/utils@0.6.14

## 0.7.2

### Patch Changes

- 8c9ab8c: Update `homepage` and other `package.json` properties
- 1ca19be: Resolve cssnano-preset-default to 5.1.7 for vulnerability patches
- Updated dependencies [8c9ab8c]
  - @compiled/utils@0.6.13

## 0.7.1

### Patch Changes

- 79cfb08: Internal refactor changing how the TypeScript compiler picks up source files.
- Updated dependencies [79cfb08]
  - @compiled/utils@0.6.12

## 0.7.0

### Minor Changes

- bcb2a68: Add option to disable the autoprefixer by setting `process.env.AUTOPREFIXER` to `off`

## 0.6.11

### Patch Changes

- 40bc0d9: Package descriptions have been updated.
- 1b1c964: Unhandled exceptions thrown when parsing CSS now have more meaningful errors.
- Updated dependencies [40bc0d9]
  - @compiled/utils@0.6.11

## 0.6.10

### Patch Changes

- 37108e4: Compiled dependencies are now using carat range.
- Updated dependencies [992e401]
  - @compiled/utils@0.6.10

## 0.6.9

### Patch Changes

- 0bb1c11: Added new `sort` function to sort atomic style sheets.
- Updated dependencies [0bb1c11]
  - @compiled/utils@0.6.9

## 0.6.8

### Patch Changes

- aea3504: Packages now released with [changesets](https://github.com/atlassian/changesets).
- Updated dependencies [aea3504]
  - @compiled/utils@0.6.8
