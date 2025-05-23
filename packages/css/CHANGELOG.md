# @compiled/css

## 0.21.0

### Minor Changes

- 9a66324: Adds a possibly breaking change to flatten multiple selectors into separate rules to better deduplicate and sort styles.

  You can disable this by setting `flattenMultipleSelectors: false` in Babel and other config.

  For example:

  ```tsx
  css({
    '&:hover, &:focus': {
      color: 'red',
    },
  });
  ```

  Is transformed into the same code as this would be:

  ```tsx
  css({
    '&:hover': { color: 'red' },
    '&:focus': { color: 'red' },
  });
  ```

  Without this, pseudo-selectors aren't sorted properly in some scenarios.

## 0.20.0

### Minor Changes

- 197512fa: Properly handle flex keywords such as 'flex:initial', 'flex:revert', etc, rather than defaulting to 'flex:auto' on any keyword.

## 0.19.1

### Patch Changes

- 9a483f6a: Fix height property in non-media query causing Compiled to crash

## 0.19.0

### Minor Changes

- 0f64c39f: Added support for the @starting-style at-rule.

## 0.18.0

### Minor Changes

- f63b99d4: Possibly BREAKING: Default `sortShorthand` to be enabled during stylesheet extraction to match the config we have internally at Atlassian and our recommendation.

  You can opt-out from this change by setting `sortShorthand: false` in several places, refer to https://compiledcssinjs.com/docs/shorthand and package-specific documentation.

  This is only a breaking change if you expect `margin:0` to override `margin-top:8px` for example, which in other CSS-in-JS libraries may actually work, but in Compiled it's not guaranteed to work, so we forcibly sort it to guarantee the order in which these styles are applied.

### Patch Changes

- Updated dependencies [88bbe382]
  - @compiled/utils@0.13.1

## 0.17.1

### Patch Changes

- 124243cd: Fix sortShorthand when mixed with multi-property classes such as `._1jmq18uv{-webkit-text-decoration-color:initial;text-decoration-color:initial}` (previously, these broke sorting as they exited early).

## 0.17.0

### Minor Changes

- 9b960009: Fix shorthand sorting not working most of the time, when stylesheet extraction is turned on.

## 0.16.0

### Minor Changes

- 4fb5c6e1: Adds a new option that can be passed to the babel plugin called `classHashPrefix`. Its value is used to add a prefix to the class names when generating their hashes.

### Patch Changes

- Updated dependencies [2750e288]
  - @compiled/utils@0.13.0

## 0.15.0

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
- Updated dependencies [9a15e742]
  - @compiled/utils@0.12.0

## 0.14.0

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

- 4f5865a1: Fixes the parsing of custom properties (CSS variables) names in object syntax. The casing is now preserved instead of being converted to kebab-case.
- Updated dependencies [4f5865a1]
  - @compiled/utils@0.11.1

## 0.13.0

### Minor Changes

- 04cb7ae7: Update the increaseSpecificity selector to play nicely with jsdom.

### Patch Changes

- Updated dependencies [04cb7ae7]
  - @compiled/utils@0.11.0

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
